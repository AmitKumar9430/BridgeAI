package com.bridgeai.portal.controller;

import com.bridgeai.portal.dto.AssignmentDtos.*;
import com.bridgeai.portal.model.Assignment;
import com.bridgeai.portal.model.AssignmentSubmission;
import com.bridgeai.portal.model.User;
import com.bridgeai.portal.repository.AssignmentRepository;
import com.bridgeai.portal.repository.UserRepository;
import com.bridgeai.portal.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final UserRepository userRepository;
    private final AssignmentRepository assignmentRepository;
    private final com.bridgeai.portal.repository.AssignmentSubmissionRepository submissionRepository;
    private final com.bridgeai.portal.security.InstitutionSecurityUtils institutionSecurityUtils;

    @GetMapping
    public ResponseEntity<List<Assignment>> getAllAssignments(Authentication auth) {
        User user = (auth != null) ? userRepository.findByEmail(auth.getName()).orElse(null) : null;
        return ResponseEntity.ok(assignmentService.getAllAssignments(user));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Assignment>> getAssignmentsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByCourse(courseId));
    }

    @GetMapping("/student")
    public ResponseEntity<List<AssignmentWithSubmissionDto>> getStudentAssignments(
            @RequestParam(required = false) Long courseId, Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(assignmentService.getAssignmentsForStudent(courseId, user.getId(), user));
    }

    @GetMapping("/course/{courseId}/student")
    public ResponseEntity<List<AssignmentWithSubmissionDto>> getStudentAssignmentsByCourse(
            @PathVariable Long courseId, Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(assignmentService.getAssignmentsForStudent(courseId, user.getId(), user));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<Assignment> createAssignment(@RequestBody CreateAssignmentRequest req, Authentication auth) {
        User user = userRepository.findByEmail(auth.getName()).orElse(null);
        Long trainerId = user != null ? user.getId() : 1L;
        String trainerName = user != null ? user.getFullName() : "Trainer";
        Long instId = (user != null && user.getRole() != com.bridgeai.portal.model.Role.ROLE_BOSS_ADMIN) ? user.getInstitutionId() : null;
        String instName = (user != null && user.getRole() != com.bridgeai.portal.model.Role.ROLE_BOSS_ADMIN) ? user.getInstitutionName() : null;
        return ResponseEntity.ok(assignmentService.createAssignment(req, trainerId, trainerName, instId, instName));
    }

    @PutMapping("/{assignmentId}/deadline")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<Assignment> updateDeadline(
            @PathVariable Long assignmentId,
            @RequestBody UpdateDeadlineRequest req,
            Authentication auth) {
        if (auth != null) {
            User user = userRepository.findByEmail(auth.getName()).orElse(null);
            Assignment a = assignmentRepository.findById(assignmentId)
                    .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + assignmentId));
            institutionSecurityUtils.assertInstitutionAccess(user, a.getInstitutionId(), a.getInstitutionName());
        }
        return ResponseEntity.ok(assignmentService.updateDeadline(assignmentId, req.getDueDateTime()));
    }

    @PutMapping("/{assignmentId}/toggle-resubmission")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<Assignment> toggleResubmission(
            @PathVariable Long assignmentId,
            @RequestParam(defaultValue = "true") boolean allow,
            Authentication auth) {
        Long trainerId = null;
        String trainerName = "Faculty Trainer";
        if (auth != null) {
            User user = userRepository.findByEmail(auth.getName()).orElse(null);
            if (user != null) {
                trainerId = user.getId();
                trainerName = user.getFullName();
                Assignment a = assignmentRepository.findById(assignmentId)
                        .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + assignmentId));
                institutionSecurityUtils.assertInstitutionAccess(user, a.getInstitutionId(), a.getInstitutionName());
            }
        }
        return ResponseEntity.ok(assignmentService.toggleResubmission(assignmentId, allow, trainerId, trainerName));
    }

    @PostMapping("/submit")
    public ResponseEntity<AssignmentSubmission> submitAssignment(
            @RequestBody SubmitAssignmentRequest req, Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Assignment a = assignmentRepository.findById(req.getAssignmentId())
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + req.getAssignmentId()));
        institutionSecurityUtils.assertInstitutionAccess(user, a.getInstitutionId(), a.getInstitutionName());
        return ResponseEntity.ok(assignmentService.submitAssignment(req, user.getId(), user.getFullName()));
    }

    @GetMapping("/{assignmentId}/submissions")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<List<AssignmentSubmission>> getSubmissions(@PathVariable Long assignmentId, Authentication auth) {
        if (auth != null) {
            User user = userRepository.findByEmail(auth.getName()).orElse(null);
            Assignment a = assignmentRepository.findById(assignmentId)
                    .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + assignmentId));
            institutionSecurityUtils.assertInstitutionAccess(user, a.getInstitutionId(), a.getInstitutionName());
        }
        return ResponseEntity.ok(assignmentService.getSubmissionsForAssignment(assignmentId));
    }

    // Status transitions to UNDER_REVIEW when trainer views
    @GetMapping("/submissions/{submissionId}/review")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<AssignmentSubmission> reviewSubmission(@PathVariable Long submissionId, Authentication auth) {
        if (auth != null) {
            User user = userRepository.findByEmail(auth.getName()).orElse(null);
            AssignmentSubmission s = submissionRepository.findById(submissionId)
                    .orElseThrow(() -> new IllegalArgumentException("Submission not found: " + submissionId));
            institutionSecurityUtils.assertInstitutionAccess(user, s.getInstitutionId(), s.getInstitutionName());
        }
        return ResponseEntity.ok(assignmentService.reviewSubmission(submissionId));
    }

    // Status transitions to CHECKED when trainer marks
    @PostMapping("/submissions/{submissionId}/evaluate")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<AssignmentSubmission> evaluateSubmission(
            @PathVariable Long submissionId,
            @RequestBody GradeSubmissionRequest req,
            Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        AssignmentSubmission s = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found: " + submissionId));
        institutionSecurityUtils.assertInstitutionAccess(user, s.getInstitutionId(), s.getInstitutionName());
        return ResponseEntity.ok(assignmentService.evaluateSubmission(submissionId, req, user.getId()));
    }

    @PutMapping("/submissions/{submissionId}/toggle-edit")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<AssignmentSubmission> toggleSubmissionEdit(
            @PathVariable Long submissionId,
            @RequestParam(defaultValue = "true") boolean allow,
            Authentication auth) {
        Long trainerId = null;
        String trainerName = "Faculty Trainer";
        if (auth != null) {
            User user = userRepository.findByEmail(auth.getName()).orElse(null);
            if (user != null) {
                trainerId = user.getId();
                trainerName = user.getFullName();
                AssignmentSubmission s = submissionRepository.findById(submissionId)
                        .orElseThrow(() -> new IllegalArgumentException("Submission not found: " + submissionId));
                institutionSecurityUtils.assertInstitutionAccess(user, s.getInstitutionId(), s.getInstitutionName());
            }
        }
        return ResponseEntity.ok(assignmentService.toggleStudentCanEdit(submissionId, allow, trainerId, trainerName));
    }

    // Audit logs for edit permissions and edits made by students
    @GetMapping("/audit-logs")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<List<com.bridgeai.portal.model.AssignmentAuditLog>> getAuditLogs(
            @RequestParam(required = false) Long assignmentId) {
        if (assignmentId != null) {
            return ResponseEntity.ok(assignmentService.getAuditLogsByAssignment(assignmentId));
        }
        return ResponseEntity.ok(assignmentService.getAuditLogs());
    }

    @PutMapping("/{assignmentId}")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<Assignment> updateAssignment(
            @PathVariable Long assignmentId,
            @RequestBody CreateAssignmentRequest req) {
        return ResponseEntity.ok(assignmentService.updateAssignment(assignmentId, req));
    }

    @DeleteMapping("/{assignmentId}")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long assignmentId) {
        assignmentService.deleteAssignment(assignmentId);
        return ResponseEntity.noContent().build();
    }
}
