package com.bridgeai.portal.service.strategy;

import com.bridgeai.portal.dto.ExamDtos.*;
import com.bridgeai.portal.model.*;
import com.bridgeai.portal.repository.CertificateRepository;
import com.bridgeai.portal.repository.ExamAnswerRepository;
import com.bridgeai.portal.repository.ExamAttemptRepository;
import com.bridgeai.portal.repository.ExamCodingTestCaseRepository;
import com.bridgeai.portal.service.CodeExecutionService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Component
@Primary
@RequiredArgsConstructor
@Slf4j
public class HybridEvaluationStrategy implements EvaluationStrategy {

    private final ExamAnswerRepository answerRepository;
    private final ExamAttemptRepository attemptRepository;
    private final CertificateRepository certificateRepository;
    private final ExamCodingTestCaseRepository testCaseRepository;
    private final CodeExecutionService codeExecutionService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public ExamResultResponse evaluate(Exam exam, ExamAttempt attempt, List<ExamQuestion> questions, SubmitExamRequest request) {
        Map<Long, String> userMcqAnswers = request.getAnswers() != null ? request.getAnswers() : Map.of();
        Map<Long, CodingSubmissionDto> userCodingAnswers = new HashMap<>();
        if (request.getCodingAnswers() != null) {
            userCodingAnswers.putAll(request.getCodingAnswers());
        }
        if (request.getCodingSubmissions() != null) {
            for (CodingSubmissionDto sub : request.getCodingSubmissions()) {
                if (sub.getQuestionId() != null) {
                    userCodingAnswers.put(sub.getQuestionId(), sub);
                }
            }
        }

        int totalPossibleMarks = 0;
        int earnedMarks = 0;
        List<AnswerBreakdownDto> breakdowns = new ArrayList<>();

        for (ExamQuestion q : questions) {
            totalPossibleMarks += q.getMarks();

            if ("CODING".equalsIgnoreCase(q.getQuestionType())) {
                // 1. CODING PROBLEM EVALUATION
                List<ExamCodingTestCase> testCases = testCaseRepository.findByQuestionId(q.getId());
                CodingSubmissionDto sub = userCodingAnswers.get(q.getId());

                int awarded = 0;
                int passedCount = 0;
                int totalCases = testCases.size();
                String compilerOutput = null;
                List<TestCaseExecutionResultDto> executionResults = new ArrayList<>();

                if (sub != null && sub.getCode() != null && !sub.getCode().trim().isEmpty()) {
                    List<CodingTestCaseDto> dtoList = testCases.stream().map(tc -> CodingTestCaseDto.builder()
                            .id(tc.getId())
                            .input(tc.getInput())
                            .expectedOutput(tc.getExpectedOutput())
                            .sample(tc.isSample())
                            .explanation(tc.getExplanation())
                            .build()
                    ).collect(Collectors.toList());

                    CodeExecutionService.ExecutionResult exec = codeExecutionService.execute(
                            sub.getLanguage(),
                            sub.getCode(),
                            dtoList,
                            q.getTimeLimitSeconds() > 0 ? q.getTimeLimitSeconds() : 5
                    );

                    passedCount = exec.passedCount;
                    compilerOutput = exec.compilerOutput;
                    executionResults = exec.testCaseResults;

                    if (totalCases > 0) {
                        // Proportional marks: (passedCount / totalCases) * question.marks
                        awarded = Math.round(((float) passedCount / totalCases) * q.getMarks());
                    } else if ("SUCCESS".equals(exec.status)) {
                        awarded = q.getMarks();
                    }
                } else {
                    compilerOutput = "No code submitted for this problem.";
                    for (ExamCodingTestCase tc : testCases) {
                        executionResults.add(TestCaseExecutionResultDto.builder()
                                .id(tc.getId())
                                .input(tc.getInput())
                                .expectedOutput(tc.getExpectedOutput())
                                .actualOutput("")
                                .passed(false)
                                .executionTimeMs(0)
                                .error("No code submitted")
                                .sample(tc.isSample())
                                .build());
                    }
                }

                earnedMarks += awarded;
                boolean isFullyCorrect = totalCases > 0 && passedCount == totalCases;

                String executionJson = "";
                try {
                    executionJson = objectMapper.writeValueAsString(executionResults);
                } catch (JsonProcessingException ignored) {}

                ExamAnswer answer = ExamAnswer.builder()
                        .attemptId(attempt.getId())
                        .questionId(q.getId())
                        .questionType("CODING")
                        .submittedCode(sub != null ? sub.getCode() : "")
                        .selectedLanguage(sub != null ? sub.getLanguage() : "python")
                        .testCasesPassed(passedCount)
                        .totalTestCases(totalCases)
                        .compilerOutput(compilerOutput)
                        .executionDetailsJson(executionJson)
                        .correct(isFullyCorrect)
                        .marksAwarded(awarded)
                        .build();
                answerRepository.save(answer);

                breakdowns.add(AnswerBreakdownDto.builder()
                        .questionId(q.getId())
                        .questionType("CODING")
                        .problemTitle(q.getProblemTitle() != null ? q.getProblemTitle() : q.getQuestionText())
                        .questionText(q.getProblemDescription() != null ? q.getProblemDescription() : q.getQuestionText())
                        .submittedCode(sub != null ? sub.getCode() : "")
                        .selectedLanguage(sub != null ? sub.getLanguage() : "python")
                        .testCasesPassed(passedCount)
                        .totalTestCases(totalCases)
                        .compilerOutput(compilerOutput)
                        .testCaseResults(executionResults)
                        .correct(isFullyCorrect)
                        .marksAwarded(awarded)
                        .maxMarks(q.getMarks())
                        .build());

            } else {
                // 2. MCQ EVALUATION
                String chosen = userMcqAnswers.get(q.getId());
                boolean isCorrect = chosen != null && chosen.equalsIgnoreCase(q.getCorrectOption());
                int awarded = isCorrect ? q.getMarks() : 0;
                earnedMarks += awarded;

                ExamAnswer answer = ExamAnswer.builder()
                        .attemptId(attempt.getId())
                        .questionId(q.getId())
                        .questionType("MCQ")
                        .selectedOption(chosen)
                        .correct(isCorrect)
                        .marksAwarded(awarded)
                        .build();
                answerRepository.save(answer);

                breakdowns.add(AnswerBreakdownDto.builder()
                        .questionId(q.getId())
                        .questionType("MCQ")
                        .questionText(q.getQuestionText())
                        .optionA(q.getOptionA())
                        .optionB(q.getOptionB())
                        .optionC(q.getOptionC())
                        .optionD(q.getOptionD())
                        .selectedOption(chosen)
                        .correctOption(q.getCorrectOption())
                        .correct(isCorrect)
                        .marksAwarded(awarded)
                        .maxMarks(q.getMarks())
                        .explanation(q.getExplanation())
                        .build());
            }
        }

        double percentage = totalPossibleMarks > 0 ? ((double) earnedMarks / totalPossibleMarks) * 100.0 : 0.0;
        boolean passed = percentage >= exam.getPassingPercentage();

        String certCode = null;
        if (passed) {
            certCode = "BAI-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            Certificate cert = Certificate.builder()
                    .certificateCode(certCode)
                    .studentId(attempt.getStudentId())
                    .studentName(attempt.getStudentName())
                    .courseTitle(exam.getTitle())
                    .examId(exam.getId())
                    .gradePercentage(Math.round(percentage * 100.0) / 100.0)
                    .issueDate(LocalDate.now())
                    .build();
            certificateRepository.save(cert);
        }

        attempt.setCompletedAt(LocalDateTime.now());
        attempt.setScore(earnedMarks);
        attempt.setTotalMarks(totalPossibleMarks);
        attempt.setPercentage(Math.round(percentage * 10.0) / 10.0);
        attempt.setPassed(passed);
        attempt.setStatus("SUBMITTED");
        attempt.setCertificateCode(certCode);
        if (request.getSnapshotBase64() != null && !request.getSnapshotBase64().isBlank()) {
            attempt.setRecordingSnapshotUrl(request.getSnapshotBase64());
        }
        attemptRepository.save(attempt);

        return ExamResultResponse.builder()
                .attemptId(attempt.getId())
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .studentName(attempt.getStudentName())
                .score(earnedMarks)
                .totalMarks(totalPossibleMarks)
                .percentage(Math.round(percentage * 10.0) / 10.0)
                .passed(passed)
                .violationCount(attempt.getViolationCount())
                .status("SUBMITTED")
                .certificateCode(certCode)
                .canReattempt(attempt.isCanReattempt() || "SELF_ASSESSMENT".equalsIgnoreCase(exam.getAssessmentType()))
                .assessmentType(exam.getAssessmentType() != null ? exam.getAssessmentType() : "TRAINER_ASSIGNED")
                .allowMultipleAttempts("SELF_ASSESSMENT".equalsIgnoreCase(exam.getAssessmentType()) || exam.isAllowMultipleAttempts())
                .institutionName(exam.getInstitutionName())
                .breakdowns(breakdowns)
                .build();
    }
}
