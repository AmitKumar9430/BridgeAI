package com.bridgeai.portal.service;

import com.bridgeai.portal.dto.ExamDtos.ViolationReportRequest;
import com.bridgeai.portal.model.Exam;
import com.bridgeai.portal.model.ExamAttempt;
import com.bridgeai.portal.model.ExamViolation;
import com.bridgeai.portal.repository.ExamAttemptRepository;
import com.bridgeai.portal.repository.ExamRepository;
import com.bridgeai.portal.repository.ExamViolationRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProctoringService {

    private static final Logger log = LoggerFactory.getLogger(ProctoringService.class);
    private final ExamViolationRepository violationRepository;
    private final ExamAttemptRepository attemptRepository;
    private final ExamRepository examRepository;
    private final AuditLogService auditLogService;
    private final ExamService examService;

    @Transactional
    public ExamViolation recordViolation(ViolationReportRequest req, Long studentId, String ip) {
        ExamAttempt attempt = attemptRepository.findById(req.getAttemptId())
                .orElseThrow(() -> new IllegalArgumentException("Attempt not found: " + req.getAttemptId()));

        if (!"IN_PROGRESS".equals(attempt.getStatus())) {
            log.warn("Ignored violation report for attempt {} with status {}", attempt.getId(), attempt.getStatus());
            return null;
        }

        ExamViolation violation = ExamViolation.builder()
                .attemptId(attempt.getId())
                .studentId(studentId)
                .violationType(req.getViolationType())
                .details(req.getDetails())
                .timestamp(LocalDateTime.now())
                .build();
        violationRepository.save(violation);

        int currentViolations = attempt.getViolationCount() + 1;
        attempt.setViolationCount(currentViolations);

        Exam exam = examRepository.findById(attempt.getExamId()).orElse(null);
        int maxAllowed = examService.resolveEffectiveMaxStrikes(exam, studentId);

        log.warn("VIOLATION [{}] on Attempt {}: Student {} (Count: {}/{})",
                req.getViolationType(), attempt.getId(), attempt.getStudentName(), currentViolations, maxAllowed);

        // Auto submission/termination on exceeding threshold (Infographic 2: Panel 7)
        if (currentViolations >= maxAllowed) {
            attempt.setStatus("TERMINATED_BY_VIOLATION");
            attempt.setCompletedAt(LocalDateTime.now());
            attempt.setPassed(false);
            attempt.setScore(0);
            attempt.setPercentage(0.0);
            auditLogService.log(attempt.getStudentName(), "STUDENT", "EXAM_TERMINATED_VIOLATION",
                    "ExamAttempt", attempt.getId(), "Auto-terminated: exceeded violation limit of " + maxAllowed, ip);
        }

        attemptRepository.save(attempt);
        return violation;
    }

    public List<ExamViolation> getViolationsForAttempt(Long attemptId) {
        return violationRepository.findByAttemptIdOrderByTimestampAsc(attemptId);
    }
}
