package com.bridgeai.portal.controller;

import com.bridgeai.portal.dto.ExamDtos.*;
import com.bridgeai.portal.model.Exam;
import com.bridgeai.portal.model.ExamAttempt;
import com.bridgeai.portal.model.ExamQuestion;
import com.bridgeai.portal.model.ExamViolation;
import com.bridgeai.portal.model.User;
import com.bridgeai.portal.repository.UserRepository;
import com.bridgeai.portal.service.ExamService;
import com.bridgeai.portal.service.ProctoringService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;
    private final ProctoringService proctoringService;
    private final UserRepository userRepository;
    private final com.bridgeai.portal.repository.ExamAttemptRepository attemptRepository;
    private final com.bridgeai.portal.security.InstitutionSecurityUtils institutionSecurityUtils;

    @GetMapping
    public ResponseEntity<List<Exam>> getExams(Authentication auth) {
        User user = (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser"))
                ? userRepository.findByEmail(auth.getName()).orElse(null) : null;
        return ResponseEntity.ok(examService.getAvailableExams(user));
    }

    private User resolveCandidate(Authentication auth) {
        String email = (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser"))
                ? auth.getName() : "rahul.student@bridgeai.edu";
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.findByRole(com.bridgeai.portal.model.Role.ROLE_STUDENT).stream().findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("Candidate account not found")));
    }

    @PostMapping("/start/{examId}")
    public ResponseEntity<StartExamResponse> startExam(
            @PathVariable Long examId,
            Authentication auth,
            HttpServletRequest req) {
        User user = resolveCandidate(auth);
        Exam exam = examService.getExamById(examId);
        institutionSecurityUtils.assertInstitutionAccess(user, exam.getInstitutionId(), exam.getInstitutionName());
        String ip = req.getRemoteAddr();
        return ResponseEntity.ok(examService.startExam(examId, user.getId(), user.getFullName(), ip));
    }

    @PostMapping("/submit")
    public ResponseEntity<ExamResultResponse> submitExam(
            @RequestBody SubmitExamRequest request,
            Authentication auth,
            HttpServletRequest req) {
        User user = resolveCandidate(auth);
        String ip = req.getRemoteAddr();
        return ResponseEntity.ok(examService.submitExam(request, user.getId(), ip));
    }

    @PostMapping("/code/run")
    public ResponseEntity<RunCodeResponse> runCode(
            @RequestBody RunCodeRequest request) {
        return ResponseEntity.ok(examService.runCode(request));
    }

    @GetMapping("/attempts/{attemptId}/result")
    public ResponseEntity<ExamResultResponse> getAttemptResult(@PathVariable Long attemptId, Authentication auth) {
        User caller = resolveCandidate(auth);
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new IllegalArgumentException("Attempt not found: " + attemptId));
        if (caller.getRole() == com.bridgeai.portal.model.Role.ROLE_STUDENT) {
            if (!attempt.getStudentId().equals(caller.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("Access Denied: You cannot view another student's exam result.");
            }
        } else {
            institutionSecurityUtils.assertInstitutionAccess(caller, attempt.getInstitutionId(), attempt.getInstitutionName());
        }
        return ResponseEntity.ok(examService.getAttemptResult(attemptId));
    }

    @GetMapping("/latest-result")
    public ResponseEntity<ExamResultResponse> getLatestResult(Authentication auth) {
        User caller = resolveCandidate(auth);
        return ResponseEntity.ok(examService.getLatestStudentResult(caller.getId(), null));
    }

    @GetMapping("/{examId}/latest-result")
    public ResponseEntity<ExamResultResponse> getExamLatestResult(@PathVariable Long examId, Authentication auth) {
        User caller = resolveCandidate(auth);
        return ResponseEntity.ok(examService.getLatestStudentResult(caller.getId(), examId));
    }

    @GetMapping("/my-attempts")
    public ResponseEntity<List<ExamAttempt>> getMyAttempts(Authentication auth) {
        User user = resolveCandidate(auth);
        return ResponseEntity.ok(examService.getStudentAttempts(user.getId()));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<List<Exam>> getAllExams(Authentication auth) {
        User user = (auth != null) ? userRepository.findByEmail(auth.getName()).orElse(null) : null;
        return ResponseEntity.ok(examService.getAllExams(user));
    }

    @GetMapping("/all-attempts")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<List<ExamAttempt>> getAllAttempts(Authentication auth) {
        User user = (auth != null) ? userRepository.findByEmail(auth.getName()).orElse(null) : null;
        return ResponseEntity.ok(examService.getAllAttempts(user));
    }

    @PostMapping("/violation")
    public ResponseEntity<ExamViolation> logViolation(
            @RequestBody ViolationReportRequest req,
            Authentication auth,
            HttpServletRequest request) {
        User user = resolveCandidate(auth);
        String ip = request.getRemoteAddr();
        return ResponseEntity.ok(proctoringService.recordViolation(req, user.getId(), ip));
    }

    @GetMapping("/attempts/{attemptId}/violations")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<List<ExamViolation>> getViolations(@PathVariable Long attemptId) {
        return ResponseEntity.ok(proctoringService.getViolationsForAttempt(attemptId));
    }

    private User resolveTrainer(Authentication auth) {
        String email = (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser"))
                ? auth.getName() : "bharat.trainer@bridgeai.edu";
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.findByRole(com.bridgeai.portal.model.Role.ROLE_TRAINER).stream().findFirst()
                        .orElse(null));
    }

    @PostMapping("/schedule")
    public ResponseEntity<Exam> scheduleExam(
            @RequestBody ScheduleExamRequest request,
            Authentication auth,
            HttpServletRequest req) {
        User trainer = resolveTrainer(auth);
        Long trainerId = trainer != null ? trainer.getId() : 3L;
        String trainerName = (trainer != null && trainer.getFullName() != null)
                ? trainer.getFullName()
                : (request.getTrainerName() != null ? request.getTrainerName() : "Bharat Sharma");
        if (trainer != null && trainer.getRole() != com.bridgeai.portal.model.Role.ROLE_BOSS_ADMIN) {
            request.setInstitutionId(trainer.getInstitutionId());
            request.setInstitutionName(trainer.getInstitutionName());
        }
        String ip = req.getRemoteAddr();
        return ResponseEntity.ok(examService.scheduleExam(request, trainerId, trainerName, ip));
    }

    @GetMapping("/trainer/{trainerId}")
    public ResponseEntity<List<Exam>> getExamsByTrainer(@PathVariable Long trainerId) {
        return ResponseEntity.ok(examService.getExamsByTrainer(trainerId));
    }

    @GetMapping("/{examId}/questions")
    public ResponseEntity<List<ExamQuestion>> getExamQuestions(@PathVariable Long examId) {
        return ResponseEntity.ok(examService.getQuestionsForExam(examId));
    }

    @PutMapping("/attempts/{attemptId}/allow-reattempt")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<ExamAttempt> toggleReattempt(
            @PathVariable Long attemptId,
            @RequestParam(defaultValue = "true") boolean allow,
            Authentication auth) {
        if (auth != null) {
            User user = userRepository.findByEmail(auth.getName()).orElse(null);
            ExamAttempt attempt = attemptRepository.findById(attemptId)
                    .orElseThrow(() -> new IllegalArgumentException("Attempt not found: " + attemptId));
            institutionSecurityUtils.assertInstitutionAccess(user, attempt.getInstitutionId(), attempt.getInstitutionName());
        }
        return ResponseEntity.ok(examService.toggleReattempt(attemptId, allow));
    }

    @GetMapping("/student-status")
    public ResponseEntity<List<java.util.Map<String, Object>>> getStudentExamsWithStatus(Authentication auth) {
        User user = resolveCandidate(auth);
        Long studentId = user != null ? user.getId() : null;
        Long studentInstId = user != null ? user.getInstitutionId() : null;
        String studentInstName = user != null ? user.getInstitutionName() : null;
        return ResponseEntity.ok(examService.getStudentExamsWithStatus(studentId, studentInstId, studentInstName));
    }

    @PutMapping("/{examId}")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<Exam> updateExam(
            @PathVariable Long examId,
            @RequestBody ScheduleExamRequest request,
            Authentication auth) {
        if (auth != null) {
            User user = userRepository.findByEmail(auth.getName()).orElse(null);
            Exam exam = examService.getExamById(examId);
            institutionSecurityUtils.assertInstitutionAccess(user, exam.getInstitutionId(), exam.getInstitutionName());
        }
        return ResponseEntity.ok(examService.updateExam(examId, request));
    }

    @DeleteMapping("/{examId}")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<Void> deleteExam(@PathVariable Long examId, Authentication auth) {
        if (auth != null) {
            User user = userRepository.findByEmail(auth.getName()).orElse(null);
            Exam exam = examService.getExamById(examId);
            institutionSecurityUtils.assertInstitutionAccess(user, exam.getInstitutionId(), exam.getInstitutionName());
        }
        examService.deleteExam(examId);
        return ResponseEntity.noContent().build();
    }
}
