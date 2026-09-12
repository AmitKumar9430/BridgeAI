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

    @GetMapping
    public ResponseEntity<List<Exam>> getExams() {
        return ResponseEntity.ok(examService.getAvailableExams());
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
    public ResponseEntity<ExamResultResponse> getAttemptResult(@PathVariable Long attemptId) {
        return ResponseEntity.ok(examService.getAttemptResult(attemptId));
    }

    @GetMapping("/my-attempts")
    public ResponseEntity<List<ExamAttempt>> getMyAttempts(Authentication auth) {
        User user = resolveCandidate(auth);
        return ResponseEntity.ok(examService.getStudentAttempts(user.getId()));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<List<Exam>> getAllExams() {
        return ResponseEntity.ok(examService.getAllExams());
    }

    @GetMapping("/all-attempts")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<List<ExamAttempt>> getAllAttempts() {
        return ResponseEntity.ok(examService.getAllAttempts());
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
        if (request.getInstitutionId() == null && trainer != null) {
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
            @RequestParam(defaultValue = "true") boolean allow) {
        return ResponseEntity.ok(examService.toggleReattempt(attemptId, allow));
    }

    @GetMapping("/student-status")
    public ResponseEntity<List<java.util.Map<String, Object>>> getStudentExamsWithStatus(Authentication auth) {
        User user = resolveCandidate(auth);
        Long studentId = user != null ? user.getId() : null;
        Long studentInstId = user != null ? user.getInstitutionId() : null;
        return ResponseEntity.ok(examService.getStudentExamsWithStatus(studentId, studentInstId));
    }

    @PutMapping("/{examId}")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<Exam> updateExam(
            @PathVariable Long examId,
            @RequestBody ScheduleExamRequest request) {
        return ResponseEntity.ok(examService.updateExam(examId, request));
    }

    @DeleteMapping("/{examId}")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<Void> deleteExam(@PathVariable Long examId) {
        examService.deleteExam(examId);
        return ResponseEntity.noContent().build();
    }
}
