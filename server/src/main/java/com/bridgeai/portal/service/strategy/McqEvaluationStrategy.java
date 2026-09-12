package com.bridgeai.portal.service.strategy;

import com.bridgeai.portal.dto.ExamDtos.AnswerBreakdownDto;
import com.bridgeai.portal.dto.ExamDtos.ExamResultResponse;
import com.bridgeai.portal.dto.ExamDtos.SubmitExamRequest;
import com.bridgeai.portal.model.*;
import com.bridgeai.portal.repository.CertificateRepository;
import com.bridgeai.portal.repository.ExamAnswerRepository;
import com.bridgeai.portal.repository.ExamAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class McqEvaluationStrategy implements EvaluationStrategy {

    private final ExamAnswerRepository answerRepository;
    private final ExamAttemptRepository attemptRepository;
    private final CertificateRepository certificateRepository;

    @Override
    public ExamResultResponse evaluate(Exam exam, ExamAttempt attempt, List<ExamQuestion> questions, SubmitExamRequest request) {
        Map<Long, String> userAnswers = request.getAnswers() != null ? request.getAnswers() : Map.of();

        int totalPossibleMarks = 0;
        int earnedMarks = 0;
        List<AnswerBreakdownDto> breakdowns = new ArrayList<>();

        for (ExamQuestion q : questions) {
            totalPossibleMarks += q.getMarks();
            String chosen = userAnswers.get(q.getId());
            boolean isCorrect = chosen != null && chosen.equalsIgnoreCase(q.getCorrectOption());
            int awarded = isCorrect ? q.getMarks() : 0;
            earnedMarks += awarded;

            // Save individual answer for audit
            ExamAnswer answer = ExamAnswer.builder()
                    .attemptId(attempt.getId())
                    .questionId(q.getId())
                    .selectedOption(chosen)
                    .correct(isCorrect)
                    .marksAwarded(awarded)
                    .build();
            answerRepository.save(answer);

            breakdowns.add(AnswerBreakdownDto.builder()
                    .questionId(q.getId())
                    .questionText(q.getQuestionText())
                    .optionA(q.getOptionA())
                    .optionB(q.getOptionB())
                    .optionC(q.getOptionC())
                    .optionD(q.getOptionD())
                    .selectedOption(chosen)
                    .correctOption(q.getCorrectOption())
                    .correct(isCorrect)
                    .marksAwarded(awarded)
                    .explanation(q.getExplanation())
                    .build());
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
