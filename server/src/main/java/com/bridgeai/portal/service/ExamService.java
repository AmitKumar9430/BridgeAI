package com.bridgeai.portal.service;

import com.bridgeai.portal.dto.ExamDtos.*;
import com.bridgeai.portal.model.*;
import com.bridgeai.portal.repository.*;
import com.bridgeai.portal.service.strategy.EvaluationStrategy;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamRepository examRepository;
    private final ExamQuestionRepository questionRepository;
    private final ExamCodingTestCaseRepository testCaseRepository;
    private final ExamAttemptRepository attemptRepository;
    private final ExamAnswerRepository answerRepository;
    private final CourseRepository courseRepository;
    private final EvaluationStrategy evaluationStrategy;
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;
    private final InstitutionRepository institutionRepository;
    private final CodeExecutionService codeExecutionService;
    private final com.bridgeai.portal.security.InstitutionSecurityUtils institutionSecurityUtils;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Exam> getAvailableExams() {
        return getAvailableExams(null);
    }

    public List<Exam> getAvailableExams(User user) {
        List<Exam> list;
        if (user == null || user.getRole() == Role.ROLE_BOSS_ADMIN) {
            list = examRepository.findByActiveTrue();
        } else if (user.getInstitutionId() != null) {
            list = examRepository.findByInstitutionIdAndActiveTrue(user.getInstitutionId());
        } else if (user.getInstitutionName() != null && !user.getInstitutionName().isBlank()) {
            list = examRepository.findByInstitutionNameIgnoreCaseAndActiveTrue(user.getInstitutionName());
        } else {
            list = Collections.emptyList();
        }
        list = new ArrayList<>(list);
        list.sort((e1, e2) -> {
            if (e1.getCreatedAt() != null && e2.getCreatedAt() != null) {
                int cmp = e2.getCreatedAt().compareTo(e1.getCreatedAt());
                if (cmp != 0) return cmp;
            }
            Long id1 = e1.getId() != null ? e1.getId() : 0L;
            Long id2 = e2.getId() != null ? e2.getId() : 0L;
            return id2.compareTo(id1);
        });
        return list;
    }

    public Exam getExamById(Long examId) {
        return examRepository.findById(examId)
                .orElseThrow(() -> new IllegalArgumentException("Exam not found: " + examId));
    

    }
    @Transactional
    public StartExamResponse startExam(Long examId, Long studentId, String studentName, String ip) {
        Exam exam = getExamById(examId);

        // Check if scheduled end deadline has expired (for formal trainer-assigned assessments)
        boolean isSelfAssessment = "SELF_ASSESSMENT".equalsIgnoreCase(exam.getAssessmentType()) || exam.isAllowMultipleAttempts();
        if (!isSelfAssessment && exam.getScheduledEndTime() != null && LocalDateTime.now().isAfter(exam.getScheduledEndTime())) {
            throw new IllegalStateException("Assessment deadline has expired. This exam is closed and marked as MISSED (0 marks).");
        }

        // Institutional access restriction
        User student = userRepository.findById(studentId).orElse(null);
        if (student != null && student.getRole() != Role.ROLE_BOSS_ADMIN) {
            institutionSecurityUtils.assertInstitutionAccess(student, exam.getInstitutionId(), exam.getInstitutionName());
        }

        // Check existing attempt (fetch all attempts for this student and exam)
        List<ExamAttempt> allStudentAttempts = attemptRepository.findByExamIdAndStudentId(examId, studentId);
        Optional<ExamAttempt> existingOpt = attemptRepository.findTopByExamIdAndStudentIdOrderByStartedAtDesc(examId, studentId);

        if (existingOpt.isPresent() || !allStudentAttempts.isEmpty()) {
            ExamAttempt existing = existingOpt.orElse(allStudentAttempts.get(allStudentAttempts.size() - 1));
            boolean isReattemptAllowed = isSelfAssessment || existing.isCanReattempt() || allStudentAttempts.stream().anyMatch(ExamAttempt::isCanReattempt);

            // Reconnect to current ongoing session if not flagged for a fresh reattempt
            if ("IN_PROGRESS".equals(existing.getStatus()) && !isReattemptAllowed) {
                return buildStartExamResponse(exam, existing);
            }
            if (!isSelfAssessment && !isReattemptAllowed) {
                throw new IllegalStateException("You have already completed this institutional assessment (Status: " + existing.getStatus() + "). Re-attempts are locked unless permitted by your trainer.");
            }

            // Student is permitted to re-attempt or is practicing self-assessment:
            // CRITICAL: Must NOT re-enter earlier session! Archive previous attempt records & spawn a fresh new ExamAttempt.
            for (ExamAttempt prev : allStudentAttempts) {
                prev.setCanReattempt(false);
            }
            attemptRepository.saveAll(allStudentAttempts);

            ExamAttempt newAttempt = ExamAttempt.builder()
                    .examId(examId)
                    .studentId(studentId)
                    .studentName(studentName)
                    .institutionId(exam.getInstitutionId() != null ? exam.getInstitutionId() : (student != null ? student.getInstitutionId() : null))
                    .institutionName(exam.getInstitutionName() != null ? exam.getInstitutionName() : (student != null ? student.getInstitutionName() : null))
                    .startedAt(LocalDateTime.now())
                    .status("IN_PROGRESS")
                    .violationCount(0)
                    .totalMarks(exam.getTotalMarks())
                    .score(0)
                    .percentage(0.0)
                    .passed(false)
                    .canReattempt(false)
                    .build();
            attemptRepository.save(newAttempt);

            auditLogService.log(studentName, "STUDENT", isSelfAssessment ? "SELF_ASSESSMENT_PRACTICE_STARTED" : "EXAM_REATTEMPT_STARTED", "Exam", examId, "Started brand new " + (isSelfAssessment ? "practice session #" : "re-attempt session #") + newAttempt.getId() + " (previous attempts archived)", ip);
            return buildStartExamResponse(exam, newAttempt);
        }

        ExamAttempt attempt = ExamAttempt.builder()
                .examId(examId)
                .studentId(studentId)
                .studentName(studentName)
                .institutionId(exam.getInstitutionId() != null ? exam.getInstitutionId() : (student != null ? student.getInstitutionId() : null))
                .institutionName(exam.getInstitutionName() != null ? exam.getInstitutionName() : (student != null ? student.getInstitutionName() : null))
                .startedAt(LocalDateTime.now())
                .status("IN_PROGRESS")
                .violationCount(0)
                .totalMarks(exam.getTotalMarks())
                .build();
        attemptRepository.save(attempt);

        auditLogService.log(studentName, "STUDENT", isSelfAssessment ? "SELF_ASSESSMENT_STARTED" : "EXAM_STARTED", "Exam", examId, "Started " + (isSelfAssessment ? "self-assessment " : "proctored exam attempt ") + attempt.getId(), ip);

        return buildStartExamResponse(exam, attempt);
    }

    private StartExamResponse buildStartExamResponse(Exam exam, ExamAttempt attempt) {
        List<ExamQuestion> questions = questionRepository.findByExamId(exam.getId());

        if (exam.isRandomizeQuestions()) {
            List<ExamQuestion> shuffled = new ArrayList<>(questions);
            Collections.shuffle(shuffled);
            questions = shuffled;
        }

        // Project questions including coding details and sample test cases
        List<QuestionPublicDto> publicQuestions = questions.stream().map(q -> {
            List<CodingTestCasePublicDto> sampleTestCases = null;
            if ("CODING".equalsIgnoreCase(q.getQuestionType())) {
                sampleTestCases = testCaseRepository.findByQuestionIdAndSampleTrue(q.getId()).stream()
                        .map(tc -> CodingTestCasePublicDto.builder()
                                .id(tc.getId())
                                .input(tc.getInput())
                                .expectedOutput(tc.getExpectedOutput())
                                .explanation(tc.getExplanation())
                                .build())
                        .collect(Collectors.toList());
            }

            return QuestionPublicDto.builder()
                    .id(q.getId())
                    .questionType(q.getQuestionType() != null ? q.getQuestionType() : "MCQ")
                    .questionText(q.getQuestionText())
                    .optionA(q.getOptionA())
                    .optionB(q.getOptionB())
                    .optionC(q.getOptionC())
                    .optionD(q.getOptionD())
                    .marks(q.getMarks())
                    .problemTitle(q.getProblemTitle())
                    .problemDescription(q.getProblemDescription())
                    .inputFormat(q.getInputFormat())
                    .outputFormat(q.getOutputFormat())
                    .constraints(q.getConstraints())
                    .starterCodeJson(q.getStarterCodeJson())
                    .allowedLanguages(q.getAllowedLanguages())
                    .timeLimitSeconds(q.getTimeLimitSeconds() > 0 ? q.getTimeLimitSeconds() : 5)
                    .memoryLimitMb(q.getMemoryLimitMb() > 0 ? q.getMemoryLimitMb() : 256)
                    .sampleTestCases(sampleTestCases)
                    .build();
        }).collect(Collectors.toList());

        int effectiveMaxViolations = resolveEffectiveMaxStrikes(exam, attempt != null ? attempt.getStudentId() : null);

        String courseTitle = courseRepository.findById(exam.getCourseId())
                .map(Course::getTitle).orElse("Certification Course");

        return StartExamResponse.builder()
                .attemptId(attempt.getId())
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .courseTitle(courseTitle)
                .durationMinutes(exam.getDurationMinutes())
                .totalMarks(exam.getTotalMarks())
                .maxViolations(effectiveMaxViolations)
                .maxStrikesAllowed(effectiveMaxViolations)
                .assessmentType(exam.getAssessmentType() != null ? exam.getAssessmentType() : "TRAINER_ASSIGNED")
                .allowMultipleAttempts("SELF_ASSESSMENT".equalsIgnoreCase(exam.getAssessmentType()) || exam.isAllowMultipleAttempts())
                .institutionName(exam.getInstitutionName())
                .questions(publicQuestions)
                .build();
    }

    /**
     * Dynamically resolves the enforced max strikes quota strictly mandated by Super Boss Admin.
     * Checks exam institutionId, exam institutionName, course institutionName, trainer institution,
     * or taking student institution, and synchronizes the exam record if out of date.
     */
    public int resolveEffectiveMaxStrikes(Exam exam, Long studentId) {
        Institution inst = null;

        // 1. Resolve by exam's institutionId
        if (exam != null && exam.getInstitutionId() != null) {
            inst = institutionRepository.findById(exam.getInstitutionId()).orElse(null);
        }

        // 2. Resolve by exam's institutionName
        if (inst == null && exam != null && exam.getInstitutionName() != null && !exam.getInstitutionName().isBlank()) {
            String name = exam.getInstitutionName().trim();
            inst = institutionRepository.findByNameIgnoreCase(name).orElse(null);
            if (inst == null) {
                for (Institution it : institutionRepository.findAll()) {
                    if (it.getName().equalsIgnoreCase(name)
                            || (it.getCode() != null && name.toUpperCase().contains(it.getCode().toUpperCase()))
                            || (it.getName().toUpperCase().contains("IIT") && name.toUpperCase().contains("IIT"))) {
                        inst = it;
                        break;
                    }
                }
            }
        }

        // 3. Resolve by exam's course institutionName
        if (inst == null && exam != null && exam.getCourseId() != null) {
            Course course = courseRepository.findById(exam.getCourseId()).orElse(null);
            if (course != null && course.getInstitutionName() != null && !course.getInstitutionName().isBlank()) {
                String cName = course.getInstitutionName().trim();
                inst = institutionRepository.findByNameIgnoreCase(cName).orElse(null);
                if (inst == null) {
                    for (Institution it : institutionRepository.findAll()) {
                        if (it.getName().equalsIgnoreCase(cName)
                                || (it.getCode() != null && cName.toUpperCase().contains(it.getCode().toUpperCase()))
                                || (it.getName().toUpperCase().contains("IIT") && cName.toUpperCase().contains("IIT"))) {
                            inst = it;
                            break;
                        }
                    }
                }
            }
        }

        // 4. Resolve by trainer's institution
        if (inst == null && exam != null && exam.getTrainerId() != null) {
            User trainer = userRepository.findById(exam.getTrainerId()).orElse(null);
            if (trainer != null) {
                if (trainer.getInstitutionId() != null) {
                    inst = institutionRepository.findById(trainer.getInstitutionId()).orElse(null);
                }
                if (inst == null && trainer.getInstitutionName() != null && !trainer.getInstitutionName().isBlank()) {
                    String tName = trainer.getInstitutionName().trim();
                    inst = institutionRepository.findByNameIgnoreCase(tName).orElse(null);
                    if (inst == null) {
                        for (Institution it : institutionRepository.findAll()) {
                            if (it.getName().equalsIgnoreCase(tName)
                                    || (it.getCode() != null && tName.toUpperCase().contains(it.getCode().toUpperCase()))
                                    || (it.getName().toUpperCase().contains("IIT") && tName.toUpperCase().contains("IIT"))) {
                                inst = it;
                                break;
                            }
                        }
                    }
                }
            }
        }

        // 5. Resolve by taking student's institution
        if (inst == null && studentId != null) {
            User student = userRepository.findById(studentId).orElse(null);
            if (student != null) {
                if (student.getInstitutionId() != null) {
                    inst = institutionRepository.findById(student.getInstitutionId()).orElse(null);
                }
                if (inst == null && student.getInstitutionName() != null && !student.getInstitutionName().isBlank()) {
                    String sName = student.getInstitutionName().trim();
                    inst = institutionRepository.findByNameIgnoreCase(sName).orElse(null);
                    if (inst == null) {
                        for (Institution it : institutionRepository.findAll()) {
                            if (it.getName().equalsIgnoreCase(sName)
                                    || (it.getCode() != null && sName.toUpperCase().contains(it.getCode().toUpperCase()))
                                    || (it.getName().toUpperCase().contains("IIT") && sName.toUpperCase().contains("IIT"))) {
                                inst = it;
                                break;
                            }
                        }
                    }
                }
            }
        }

        // If institution found with configured max strikes, enforce and synchronize
        if (inst != null && inst.getMaxStrikesAllowed() > 0) {
            int allowed = inst.getMaxStrikesAllowed();
            if (exam != null) {
                boolean changed = false;
                if (exam.getMaxViolations() != allowed) {
                    exam.setMaxViolations(allowed);
                    changed = true;
                }
                if (exam.getInstitutionId() == null) {
                    exam.setInstitutionId(inst.getId());
                    changed = true;
                }
                if (exam.getInstitutionName() == null || exam.getInstitutionName().isBlank()) {
                    exam.setInstitutionName(inst.getName());
                    changed = true;
                }
                if (changed) {
                    examRepository.save(exam);
                }
            }
            return allowed;
        }

        return (exam != null && exam.getMaxViolations() > 0) ? exam.getMaxViolations() : 3;
    }
    @Transactional
    public ExamResultResponse submitExam(SubmitExamRequest request, Long studentId, String ip) {
        ExamAttempt attempt = attemptRepository.findById(request.getAttemptId())
                .orElseThrow(() -> new IllegalArgumentException("Exam attempt not found: " + request.getAttemptId()));

        if (!attempt.getStudentId().equals(studentId)) {
            throw new SecurityException("Unauthorized attempt submission.");
        }

        if ("SUBMITTED".equals(attempt.getStatus()) || "TERMINATED_BY_VIOLATION".equals(attempt.getStatus())) {
            return getAttemptResult(attempt.getId());
        }

        Exam exam = getExamById(attempt.getExamId());
        List<ExamQuestion> questions = questionRepository.findByExamId(exam.getId());

        ExamResultResponse response = evaluationStrategy.evaluate(exam, attempt, questions, request);

        auditLogService.log(attempt.getStudentName(), "STUDENT", "EXAM_SUBMITTED", "ExamAttempt", attempt.getId(),
                "Score: " + response.getScore() + "/" + response.getTotalMarks() + " (Passed: " + response.isPassed() + ")", ip);

        return response;
    }

    public ExamResultResponse getAttemptResult(Long attemptId) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new IllegalArgumentException("Attempt not found: " + attemptId));
        Exam exam = getExamById(attempt.getExamId());
        List<ExamQuestion> questions = questionRepository.findByExamId(exam.getId());
        List<ExamAnswer> answers = answerRepository.findByAttemptId(attemptId);

        Map<Long, ExamAnswer> answerMap = answers.stream()
                .collect(Collectors.toMap(ExamAnswer::getQuestionId, a -> a, (k1, k2) -> k1));

        List<AnswerBreakdownDto> breakdowns = questions.stream().map(q -> {
            ExamAnswer ans = answerMap.get(q.getId());
            if ("CODING".equalsIgnoreCase(q.getQuestionType())) {
                List<TestCaseExecutionResultDto> tcResults = new ArrayList<>();
                if (ans != null && ans.getExecutionDetailsJson() != null && !ans.getExecutionDetailsJson().isBlank()) {
                    try {
                        tcResults = objectMapper.readValue(
                                ans.getExecutionDetailsJson(),
                                objectMapper.getTypeFactory().constructCollectionType(List.class, TestCaseExecutionResultDto.class)
                        );
                    } catch (Exception ignored) {}
                }

                return AnswerBreakdownDto.builder()
                        .questionId(q.getId())
                        .questionType("CODING")
                        .problemTitle(q.getProblemTitle() != null ? q.getProblemTitle() : q.getQuestionText())
                        .questionText(q.getProblemDescription() != null ? q.getProblemDescription() : q.getQuestionText())
                        .submittedCode(ans != null ? ans.getSubmittedCode() : "")
                        .selectedLanguage(ans != null ? ans.getSelectedLanguage() : "python")
                        .testCasesPassed(ans != null ? ans.getTestCasesPassed() : 0)
                        .totalTestCases(ans != null ? ans.getTotalTestCases() : 0)
                        .compilerOutput(ans != null ? ans.getCompilerOutput() : null)
                        .testCaseResults(tcResults)
                        .correct(ans != null && ans.isCorrect())
                        .marksAwarded(ans != null ? ans.getMarksAwarded() : 0)
                        .maxMarks(q.getMarks())
                        .build();
            }

            String sel = ans != null ? ans.getSelectedOption() : null;
            boolean corr = ans != null && ans.isCorrect();
            int marks = ans != null ? ans.getMarksAwarded() : 0;
            return AnswerBreakdownDto.builder()
                    .questionId(q.getId())
                    .questionType("MCQ")
                    .questionText(q.getQuestionText())
                    .optionA(q.getOptionA())
                    .optionB(q.getOptionB())
                    .optionC(q.getOptionC())
                    .optionD(q.getOptionD())
                    .selectedOption(sel)
                    .correctOption(q.getCorrectOption())
                    .correct(corr)
                    .marksAwarded(marks)
                    .maxMarks(q.getMarks())
                    .explanation(q.getExplanation())
                    .build();
        }).collect(Collectors.toList());

        return ExamResultResponse.builder()
                .attemptId(attempt.getId())
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .studentName(attempt.getStudentName())
                .score(attempt.getScore())
                .totalMarks(attempt.getTotalMarks())
                .percentage(attempt.getPercentage())
                .passed(attempt.isPassed())
                .violationCount(attempt.getViolationCount())
                .status(attempt.getStatus())
                .certificateCode(attempt.getCertificateCode())
                .canReattempt(attempt.isCanReattempt() || "SELF_ASSESSMENT".equalsIgnoreCase(exam.getAssessmentType()))
                .assessmentType(exam.getAssessmentType() != null ? exam.getAssessmentType() : "TRAINER_ASSIGNED")
                .allowMultipleAttempts("SELF_ASSESSMENT".equalsIgnoreCase(exam.getAssessmentType()) || exam.isAllowMultipleAttempts())
                .institutionName(exam.getInstitutionName())
                .breakdowns(breakdowns)
                .build();
    }

    public RunCodeResponse runCode(RunCodeRequest req) {
        List<CodingTestCaseDto> testCases = req.getSampleTestCases();
        if (testCases == null || testCases.isEmpty()) {
            if (req.getQuestionId() != null) {
                List<ExamCodingTestCase> dbCases = req.isEvaluateAll()
                        ? testCaseRepository.findByQuestionId(req.getQuestionId())
                        : testCaseRepository.findByQuestionIdAndSampleTrue(req.getQuestionId());
                testCases = dbCases.stream()
                        .map(tc -> CodingTestCaseDto.builder()
                                .id(tc.getId())
                                .input(tc.getInput())
                                .expectedOutput(tc.getExpectedOutput())
                                .sample(tc.isSample())
                                .explanation(tc.getExplanation())
                                .build())
                        .collect(Collectors.toList());
            }
        }

        if (req.getCustomInput() != null && !req.getCustomInput().isEmpty()) {
            testCases = Collections.singletonList(CodingTestCaseDto.builder()
                    .id(0L)
                    .input(req.getCustomInput())
                    .expectedOutput("")
                    .sample(true)
                    .explanation("Custom Input Run")
                    .build());
        }

        CodeExecutionService.ExecutionResult res = codeExecutionService.execute(
                req.getLanguage(),
                req.getCode(),
                testCases,
                req.getTimeLimitSeconds() > 0 ? req.getTimeLimitSeconds() : 5
        );

        boolean isCompiled = !"COMPILATION_ERROR".equalsIgnoreCase(res.status);
        String customOut = null;
        if (req.getCustomInput() != null && !req.getCustomInput().isEmpty() && res.testCaseResults != null && !res.testCaseResults.isEmpty()) {
            customOut = res.testCaseResults.get(0).getActualOutput();
        }

        // Sanitize hidden test cases so student cannot see trainer's hidden test vectors in inspector
        List<TestCaseExecutionResultDto> sanitizedResults = res.testCaseResults;
        if (req.isEvaluateAll() && sanitizedResults != null) {
            sanitizedResults = sanitizedResults.stream().map(tc -> {
                if (!tc.isSample()) {
                    return TestCaseExecutionResultDto.builder()
                            .id(tc.getId())
                            .input("[Hidden Evaluation Test Case]")
                            .expectedOutput("[Hidden Evaluation Output]")
                            .actualOutput(tc.isPassed() ? "[Passed]" : "[Output Hidden]")
                            .passed(tc.isPassed())
                            .executionTimeMs(tc.getExecutionTimeMs())
                            .error(tc.getError())
                            .sample(false)
                            .build();
                }
                return tc;
            }).collect(Collectors.toList());
        }

        String verdictStatus = res.status;
        if (req.isEvaluateAll()) {
            if (!isCompiled) {
                verdictStatus = "COMPILATION_ERROR";
            } else if (res.passedCount == res.totalCount) {
                verdictStatus = "ACCEPTED";
            } else {
                verdictStatus = "WRONG_ANSWER";
            }
        }

        return RunCodeResponse.builder()
                .status(verdictStatus)
                .compiled(isCompiled)
                .compilerError(isCompiled ? null : res.compilerOutput)
                .compilerOutput(res.compilerOutput)
                .customOutput(customOut)
                .passedCount(res.passedCount)
                .totalCount(res.totalCount)
                .totalExecutionTimeMs(res.totalExecutionTimeMs)
                .testCaseResults(sanitizedResults)
                .build();
    }

    public List<ExamAttempt> getStudentAttempts(Long studentId) {
        return attemptRepository.findByStudentIdOrderByStartedAtDesc(studentId);
    }

    public List<ExamAttempt> getAllAttempts() {
        return getAllAttempts(null);
    }

    public List<ExamAttempt> getAllAttempts(User user) {
        if (user == null || user.getRole() == Role.ROLE_BOSS_ADMIN) {
            return attemptRepository.findAllByOrderByStartedAtDesc();
        }
        if (user.getInstitutionId() != null) {
            return attemptRepository.findByInstitutionIdOrderByStartedAtDesc(user.getInstitutionId());
        }
        if (user.getInstitutionName() != null && !user.getInstitutionName().isBlank()) {
            return attemptRepository.findByInstitutionNameOrderByStartedAtDesc(user.getInstitutionName());
        }
        return Collections.emptyList();
    }

    @Transactional
    public Exam createExamWithQuestions(Exam exam, List<ExamQuestion> questions) {
        exam.setCreatedAt(LocalDateTime.now());
        Exam savedExam = examRepository.save(exam);
        for (ExamQuestion q : questions) {
            q.setExamId(savedExam.getId());
            questionRepository.save(q);
        }
        return savedExam;
    

    }
    @Transactional
    public Exam scheduleExam(ScheduleExamRequest req, Long trainerId, String trainerName, String ip) {
        if (req.getTitle() == null || req.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Exam title cannot be empty");
        }
        if (req.getCourseId() == null) {
            throw new IllegalArgumentException("Course ID is required");
        }

        int totalMarks = req.getTotalMarks();
        if (req.getQuestions() != null && !req.getQuestions().isEmpty()) {
            int questionsSum = req.getQuestions().stream().mapToInt(CreateQuestionDto::getMarks).sum();
            if (questionsSum > 0) {
                totalMarks = questionsSum;
            }
        }
        if (totalMarks <= 0) {
            totalMarks = 100;
        }

        // Enforce max strikes policy: Max strikes is strictly decided by Super Boss Admin
        Long instId = req.getInstitutionId();
        String instName = req.getInstitutionName();
        if (instId == null || instName == null || instName.isBlank()) {
            if (trainerId != null) {
                User trainer = userRepository.findById(trainerId).orElse(null);
                if (trainer != null) {
                    if (instId == null) instId = trainer.getInstitutionId();
                    if (instName == null || instName.isBlank()) instName = trainer.getInstitutionName();
                }
            }
        }
        if ((instId == null || instName == null || instName.isBlank()) && req.getCourseId() != null) {
            Course course = courseRepository.findById(req.getCourseId()).orElse(null);
            if (course != null) {
                if (instId == null) instId = course.getInstitutionId();
                if (instName == null || instName.isBlank()) instName = course.getInstitutionName();
            }
        }
        if (instId == null && instName != null && !instName.isBlank()) {
            Institution foundInst = institutionRepository.findByNameIgnoreCase(instName.trim()).orElse(null);
            if (foundInst != null) {
                instId = foundInst.getId();
                instName = foundInst.getName();
            }
        }

        int enforcedMaxStrikes = 3;
        if (instId != null) {
            enforcedMaxStrikes = institutionRepository.findById(instId)
                    .map(Institution::getMaxStrikesAllowed)
                    .filter(m -> m > 0)
                    .orElse(3);
        } else if (instName != null && !instName.isBlank()) {
            enforcedMaxStrikes = institutionRepository.findByNameIgnoreCase(instName.trim())
                    .map(Institution::getMaxStrikesAllowed)
                    .filter(m -> m > 0)
                    .orElse(3);
        }

        Exam exam = Exam.builder()
                .courseId(req.getCourseId())
                .moduleId(req.getModuleId())
                .title(req.getTitle().trim())
                .description(req.getDescription())
                .instructions(req.getInstructions())
                .trainerId(trainerId)
                .trainerName(trainerName != null ? trainerName : req.getTrainerName())
                .institutionId(instId)
                .institutionName(instName)
                .assessmentType(req.getAssessmentType() != null ? req.getAssessmentType() : "TRAINER_ASSIGNED")
                .allowMultipleAttempts("SELF_ASSESSMENT".equalsIgnoreCase(req.getAssessmentType()) || req.isAllowMultipleAttempts())
                .scheduledStartTime(req.getScheduledStartTime())
                .scheduledEndTime(req.getScheduledEndTime())
                .durationMinutes(req.getDurationMinutes() > 0 ? req.getDurationMinutes() : 45)
                .passingPercentage(req.getPassingPercentage() > 0 ? req.getPassingPercentage() : 60)
                .maxViolations(enforcedMaxStrikes)
                .totalMarks(totalMarks)
                .active(true)
                .randomizeQuestions(true)
                .createdAt(LocalDateTime.now())
                .build();

        Exam savedExam = examRepository.save(exam);

        if (req.getQuestions() != null && !req.getQuestions().isEmpty()) {
            for (CreateQuestionDto qDto : req.getQuestions()) {
                String qType = qDto.getQuestionType() != null ? qDto.getQuestionType().toUpperCase() : "MCQ";
                ExamQuestion question = ExamQuestion.builder()
                        .examId(savedExam.getId())
                        .questionType(qType)
                        .marks(qDto.getMarks() > 0 ? qDto.getMarks() : 10)
                        // MCQ fields
                        .questionText(qDto.getQuestionText() != null ? qDto.getQuestionText() : qDto.getProblemTitle())
                        .optionA(qDto.getOptionA())
                        .optionB(qDto.getOptionB())
                        .optionC(qDto.getOptionC())
                        .optionD(qDto.getOptionD())
                        .correctOption(ExamQuestion.normalizeCorrectOption(qDto.getCorrectOption(), qDto.getOptionA(), qDto.getOptionB(), qDto.getOptionC(), qDto.getOptionD()))
                        .explanation(qDto.getExplanation())
                        // Coding fields
                        .problemTitle(qDto.getProblemTitle() != null ? qDto.getProblemTitle() : qDto.getQuestionText())
                        .problemDescription(qDto.getProblemDescription() != null ? qDto.getProblemDescription() : qDto.getQuestionText())
                        .inputFormat(qDto.getInputFormat())
                        .outputFormat(qDto.getOutputFormat())
                        .constraints(qDto.getConstraints())
                        .starterCodeJson(qDto.getStarterCodeJson())
                        .allowedLanguages(qDto.getAllowedLanguages() != null ? qDto.getAllowedLanguages() : "c,cpp,java,python,csharp,kotlin")
                        .timeLimitSeconds(qDto.getTimeLimitSeconds() > 0 ? qDto.getTimeLimitSeconds() : 5)
                        .memoryLimitMb(qDto.getMemoryLimitMb() > 0 ? qDto.getMemoryLimitMb() : 256)
                        .build();

                ExamQuestion savedQ = questionRepository.save(question);

                if ("CODING".equalsIgnoreCase(qType) && qDto.getTestCases() != null) {
                    for (CodingTestCaseDto tcDto : qDto.getTestCases()) {
                        ExamCodingTestCase tc = ExamCodingTestCase.builder()
                                .questionId(savedQ.getId())
                                .input(tcDto.getInput() != null ? tcDto.getInput() : "")
                                .expectedOutput(tcDto.getExpectedOutput() != null ? tcDto.getExpectedOutput() : "")
                                .sample(tcDto.isSample())
                                .explanation(tcDto.getExplanation())
                                .build();
                        testCaseRepository.save(tc);
                    }
                }
            }
        }

        auditLogService.log(trainerName != null ? trainerName : "Trainer", "TRAINER", "EXAM_SCHEDULED", "Exam", savedExam.getId(),
                "Scheduled exam '" + savedExam.getTitle() + "' with " + (req.getQuestions() != null ? req.getQuestions().size() : 0) + " questions", ip);

        return savedExam;
    }

    public List<Exam> getExamsByTrainer(Long trainerId) {
        List<Exam> list = (trainerId != null) ? examRepository.findByTrainerId(trainerId) : examRepository.findAll();
        list.sort((e1, e2) -> {
            if (e1.getCreatedAt() != null && e2.getCreatedAt() != null) {
                int cmp = e2.getCreatedAt().compareTo(e1.getCreatedAt());
                if (cmp != 0) return cmp;
            }
            Long id1 = e1.getId() != null ? e1.getId() : 0L;
            Long id2 = e2.getId() != null ? e2.getId() : 0L;
            return id2.compareTo(id1);
        });
        return list;
    }

    public List<Exam> getAllExams() {
        return getAllExams(null);
    }

    public List<Exam> getAllExams(User user) {
        List<Exam> list;
        if (user == null || user.getRole() == Role.ROLE_BOSS_ADMIN) {
            list = examRepository.findAll();
        } else if (user.getInstitutionId() != null) {
            list = examRepository.findByInstitutionId(user.getInstitutionId());
        } else if (user.getInstitutionName() != null && !user.getInstitutionName().isBlank()) {
            list = examRepository.findByInstitutionNameIgnoreCase(user.getInstitutionName());
        } else {
            list = Collections.emptyList();
        }
        list = new ArrayList<>(list);
        list.sort((e1, e2) -> {
            if (e1.getCreatedAt() != null && e2.getCreatedAt() != null) {
                int cmp = e2.getCreatedAt().compareTo(e1.getCreatedAt());
                if (cmp != 0) return cmp;
            }
            Long id1 = e1.getId() != null ? e1.getId() : 0L;
            Long id2 = e2.getId() != null ? e2.getId() : 0L;
            return id2.compareTo(id1);
        });
        return list;
    }

    public List<ExamQuestion> getQuestionsForExam(Long examId) {
        return questionRepository.findByExamId(examId);
    }

    @Transactional
    public ExamAttempt toggleReattempt(Long attemptId, boolean allow) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new IllegalArgumentException("Attempt not found: " + attemptId));
        attempt.setCanReattempt(allow);
        if (attempt.getExamId() != null && attempt.getStudentId() != null) {
            List<ExamAttempt> all = attemptRepository.findByExamIdAndStudentId(attempt.getExamId(), attempt.getStudentId());
            for (ExamAttempt a : all) {
                a.setCanReattempt(allow);
            }
            attemptRepository.saveAll(all);
        }
        return attemptRepository.save(attempt);
    }

    public List<Map<String, Object>> getStudentExamsWithStatus(Long studentId) {
        return getStudentExamsWithStatus(studentId, null, null);
    }

    public List<Map<String, Object>> getStudentExamsWithStatus(Long studentId, Long studentInstitutionId) {
        return getStudentExamsWithStatus(studentId, studentInstitutionId, null);
    }

    public List<Map<String, Object>> getStudentExamsWithStatus(Long studentId, Long studentInstitutionId, String studentInstitutionName) {
        List<Exam> exams = examRepository.findByActiveTrue();
        exams = new ArrayList<>(exams);
        exams.sort((e1, e2) -> {
            if (e1.getCreatedAt() != null && e2.getCreatedAt() != null) {
                int cmp = e2.getCreatedAt().compareTo(e1.getCreatedAt());
                if (cmp != 0) return cmp;
            }
            Long id1 = e1.getId() != null ? e1.getId() : 0L;
            Long id2 = e2.getId() != null ? e2.getId() : 0L;
            return id2.compareTo(id1);
        });

        List<ExamAttempt> attempts = (studentId != null) ? attemptRepository.findByStudentIdOrderByStartedAtDesc(studentId) : Collections.emptyList();
        Map<Long, ExamAttempt> attemptMap = attempts.stream()
                .collect(Collectors.toMap(ExamAttempt::getExamId, a -> a, (k1, k2) -> k1));

        List<Map<String, Object>> list = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (Exam exam : exams) {
            // Strict institutional boundary: If exam belongs to an institution, student must belong to it
            if (exam.getInstitutionId() != null || (exam.getInstitutionName() != null && !exam.getInstitutionName().isBlank())) {
                boolean match = false;
                if (studentInstitutionId != null && exam.getInstitutionId() != null) {
                    match = studentInstitutionId.equals(exam.getInstitutionId());
                } else if (studentInstitutionName != null && exam.getInstitutionName() != null) {
                    match = studentInstitutionName.trim().equalsIgnoreCase(exam.getInstitutionName().trim());
                }
                if (!match) {
                    continue;
                }
            }

            Map<String, Object> map = new HashMap<>();
            map.put("examId", exam.getId());
            map.put("courseId", exam.getCourseId());
            map.put("moduleId", exam.getModuleId());
            map.put("title", exam.getTitle());
            map.put("description", exam.getDescription());
            map.put("instructions", exam.getInstructions());
            map.put("durationMinutes", exam.getDurationMinutes());
            map.put("totalMarks", exam.getTotalMarks());
            map.put("passingPercentage", exam.getPassingPercentage());
            map.put("scheduledStartTime", exam.getScheduledStartTime());
            map.put("scheduledEndTime", exam.getScheduledEndTime());
            map.put("trainerName", exam.getTrainerName());
            map.put("assessmentType", exam.getAssessmentType() != null ? exam.getAssessmentType() : "TRAINER_ASSIGNED");
            map.put("institutionId", exam.getInstitutionId());
            map.put("institutionName", exam.getInstitutionName());
            map.put("allowMultipleAttempts", "SELF_ASSESSMENT".equalsIgnoreCase(exam.getAssessmentType()) || exam.isAllowMultipleAttempts());
            map.put("createdAt", exam.getCreatedAt());

            ExamAttempt att = attemptMap.get(exam.getId());
            if (att != null) {
                map.put("attemptId", att.getId());
                map.put("attemptStatus", att.getStatus());
                map.put("displayStatus", "IN_PROGRESS".equalsIgnoreCase(att.getStatus()) ? "IN_PROGRESS" : "DONE");
                map.put("score", att.getScore());
                map.put("percentage", att.getPercentage());
                map.put("passed", att.isPassed());
                map.put("canReattempt", "SELF_ASSESSMENT".equalsIgnoreCase(exam.getAssessmentType()) || att.isCanReattempt());
                map.put("completedAt", att.getCompletedAt());
                map.put("startedAt", att.getStartedAt());
            } else {
                boolean isMissed = !"SELF_ASSESSMENT".equalsIgnoreCase(exam.getAssessmentType())
                        && exam.getScheduledEndTime() != null
                        && now.isAfter(exam.getScheduledEndTime());
                if (isMissed) {
                    map.put("displayStatus", "MISSED");
                    map.put("score", 0);
                    map.put("percentage", 0.0);
                    map.put("passed", false);
                    map.put("canReattempt", false);
                } else {
                    map.put("displayStatus", "AVAILABLE");
                    map.put("canReattempt", true);
                }
            }
            list.add(map);
        }

        // Sort: Most recently triggered / actionable assessment appears at the top
        list.sort((m1, m2) -> {
            // 1. IN_PROGRESS active exam at the very top
            String s1 = (String) m1.getOrDefault("displayStatus", "");
            String s2 = (String) m2.getOrDefault("displayStatus", "");
            boolean p1 = "IN_PROGRESS".equalsIgnoreCase(s1);
            boolean p2 = "IN_PROGRESS".equalsIgnoreCase(s2);
            if (p1 != p2) return p2 ? 1 : -1;

            // 2. Actionable assessments (AVAILABLE or canReattempt) before locked/missed
            boolean can1 = Boolean.TRUE.equals(m1.get("canReattempt")) || "AVAILABLE".equalsIgnoreCase(s1);
            boolean can2 = Boolean.TRUE.equals(m2.get("canReattempt")) || "AVAILABLE".equalsIgnoreCase(s2);
            if (can1 != can2) return can2 ? 1 : -1;

            // 3. Most recently triggered / started / created time (newest first)
            LocalDateTime t1 = (LocalDateTime) m1.get("startedAt");
            if (t1 == null) t1 = (LocalDateTime) m1.get("createdAt");
            if (t1 == null) t1 = (LocalDateTime) m1.get("scheduledStartTime");

            LocalDateTime t2 = (LocalDateTime) m2.get("startedAt");
            if (t2 == null) t2 = (LocalDateTime) m2.get("createdAt");
            if (t2 == null) t2 = (LocalDateTime) m2.get("scheduledStartTime");

            if (t1 != null && t2 != null) {
                int c = t2.compareTo(t1);
                if (c != 0) return c;
            } else if (t2 != null) {
                return 1;
            } else if (t1 != null) {
                return -1;
            }

            // 4. Fallback to examId descending
            Long id1 = (Long) m1.getOrDefault("examId", 0L);
            Long id2 = (Long) m2.getOrDefault("examId", 0L);
            return id2.compareTo(id1);
        });

        return list;
    }


    @Transactional
    public Exam updateExam(Long examId, ScheduleExamRequest req) {
        Exam exam = getExamById(examId);
        if (req.getTitle() != null && !req.getTitle().isBlank()) {
            exam.setTitle(req.getTitle().trim());
        }
        if (req.getDescription() != null) {
            exam.setDescription(req.getDescription().trim());
        }

        if (req.getDurationMinutes() > 0) {
            exam.setDurationMinutes(req.getDurationMinutes());
        }
        if (req.getTotalMarks() > 0) {
            exam.setTotalMarks(req.getTotalMarks());
        }
        if (req.getPassingPercentage() > 0) {
            exam.setPassingPercentage(req.getPassingPercentage());
        }
        if (req.getScheduledStartTime() != null) {
            exam.setScheduledStartTime(req.getScheduledStartTime());
        }
        if (req.getScheduledEndTime() != null) {
            exam.setScheduledEndTime(req.getScheduledEndTime());
        }
        // If institution max strikes was configured by Boss Admin, maintain synchronization
        if (exam.getInstitutionId() != null) {
            institutionRepository.findById(exam.getInstitutionId())
                    .ifPresent(inst -> {
                        if (inst.getMaxStrikesAllowed() > 0) {
                            exam.setMaxViolations(inst.getMaxStrikesAllowed());
                        }
                    });
        }
        return examRepository.save(exam);
    

    }
    @Transactional
    public void deleteExam(Long examId) {
        List<ExamAttempt> attempts = attemptRepository.findByExamId(examId);
        for (ExamAttempt att : attempts) {
            answerRepository.deleteAll(answerRepository.findByAttemptId(att.getId()));
        }
        attemptRepository.deleteAll(attempts);

        List<ExamQuestion> questions = questionRepository.findByExamId(examId);
        for (ExamQuestion q : questions) {
            testCaseRepository.deleteAll(testCaseRepository.findByQuestionId(q.getId()));
        }
        questionRepository.deleteAll(questions);

        examRepository.deleteById(examId);
    }
}
