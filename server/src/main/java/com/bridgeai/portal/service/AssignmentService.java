package com.bridgeai.portal.service;

import com.bridgeai.portal.dto.AssignmentDtos.*;
import com.bridgeai.portal.model.Assignment;
import com.bridgeai.portal.model.AssignmentSubmission;
import com.bridgeai.portal.model.AssignmentAuditLog;
import com.bridgeai.portal.repository.AssignmentRepository;
import com.bridgeai.portal.repository.AssignmentSubmissionRepository;
import com.bridgeai.portal.repository.AssignmentAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final AssignmentAuditLogRepository auditLogRepository;
    private final com.bridgeai.portal.security.InstitutionSecurityUtils institutionSecurityUtils;

    public List<Assignment> getAllAssignments() {
        return getAllAssignments(null);
    }

    public List<Assignment> getAllAssignments(com.bridgeai.portal.model.User user) {
        if (user == null || user.getRole() == com.bridgeai.portal.model.Role.ROLE_BOSS_ADMIN) {
            return assignmentRepository.findAllByOrderByCreatedAtDesc();
        }
        if (user.getInstitutionId() != null) {
            return assignmentRepository.findByInstitutionIdOrderByCreatedAtDesc(user.getInstitutionId());
        }
        if (user.getInstitutionName() != null && !user.getInstitutionName().isBlank()) {
            return assignmentRepository.findByInstitutionNameOrderByCreatedAtDesc(user.getInstitutionName());
        }
        return java.util.Collections.emptyList();
    }

    public List<Assignment> getAssignmentsByCourse(Long courseId) {
        return assignmentRepository.findByCourseId(courseId);
    }

    public List<Assignment> getAssignmentsByTrainer(Long trainerId) {
        return assignmentRepository.findByTrainerId(trainerId);
    }

    public List<AssignmentWithSubmissionDto> getAssignmentsForStudent(Long courseId, Long studentId) {
        return getAssignmentsForStudent(courseId, studentId, null);
    }

    public List<AssignmentWithSubmissionDto> getAssignmentsForStudent(Long courseId, Long studentId, com.bridgeai.portal.model.User student) {
        List<Assignment> assignments;
        if (student == null || student.getRole() == com.bridgeai.portal.model.Role.ROLE_BOSS_ADMIN) {
            assignments = courseId != null && courseId > 0 
                    ? assignmentRepository.findByCourseId(courseId) 
                    : assignmentRepository.findAllByOrderByCreatedAtDesc();
        } else if (student.getInstitutionId() != null) {
            assignments = courseId != null && courseId > 0
                    ? assignmentRepository.findByCourseIdAndInstitutionId(courseId, student.getInstitutionId())
                    : assignmentRepository.findByInstitutionIdOrderByCreatedAtDesc(student.getInstitutionId());
        } else if (student.getInstitutionName() != null && !student.getInstitutionName().isBlank()) {
            assignments = assignmentRepository.findByInstitutionNameOrderByCreatedAtDesc(student.getInstitutionName());
        } else {
            assignments = java.util.Collections.emptyList();
        }
        List<AssignmentWithSubmissionDto> dtos = new ArrayList<>();

        for (Assignment a : assignments) {
            // Check if assigned to this student
            boolean isAssigned = a.isAssignedToAll();
            if (!isAssigned && a.getAssignedStudentIds() != null && !a.getAssignedStudentIds().isBlank()) {
                String ids = a.getAssignedStudentIds();
                for (String idStr : ids.split("[,\\s]+")) {
                    if (idStr.trim().equals(String.valueOf(studentId))) {
                        isAssigned = true;
                        break;
                    }
                }
            }

            if (isAssigned) {
                AssignmentSubmission sub = submissionRepository.findByAssignmentIdAndStudentId(a.getId(), studentId).orElse(null);
                dtos.add(AssignmentWithSubmissionDto.builder()
                        .assignment(a)
                        .mySubmission(sub)
                        .build());
            }
        }
        return dtos;
    }

    private LocalDateTime parseDateTime(String dtStr) {
        if (dtStr == null || dtStr.isBlank()) {
            return LocalDateTime.now().plusDays(7);
        }
        try {
            if (dtStr.length() == 16) {
                return LocalDateTime.parse(dtStr + ":00");
            }
            return LocalDateTime.parse(dtStr);
        } catch (Exception e) {
            return LocalDateTime.now().plusDays(7);
        }
    }

    @Transactional
    public Assignment createAssignment(CreateAssignmentRequest req, Long trainerId, String trainerName) {
        return createAssignment(req, trainerId, trainerName, null, null);
    }

    @Transactional
    public Assignment createAssignment(CreateAssignmentRequest req, Long trainerId, String trainerName, Long institutionId, String institutionName) {
        Assignment assignment = Assignment.builder()
                .courseId(req.getCourseId() != null ? req.getCourseId() : 1L)
                .trainerId(trainerId)
                .trainerName(trainerName)
                .institutionId(institutionId)
                .institutionName(institutionName)
                .subjectName(req.getSubjectName() != null ? req.getSubjectName() : "General Computer Science")
                .title(req.getTitle())
                .description(req.getDescription())
                .dueDateTime(parseDateTime(req.getDueDateTime()))
                .pdfAttachmentUrl(req.getPdfAttachmentUrl())
                .submissionType("PDF")
                .maxScore(req.getMaxScore() != null ? req.getMaxScore() : 100)
                .assignedToAll(req.isAssignedToAll())
                .assignedStudentIds(req.getAssignedStudentIds())
                .allowResubmission(req.isAllowResubmission())
                .createdAt(LocalDateTime.now())
                .build();
        return assignmentRepository.save(assignment);
    }

    @Transactional
    public AssignmentSubmission submitAssignment(SubmitAssignmentRequest req, Long studentId, String studentName) {
        Assignment assignment = assignmentRepository.findById(req.getAssignmentId())
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + req.getAssignmentId()));

        LocalDateTime deadline = assignment.getDueDateTime();
        if (deadline == null && assignment.getDueDate() != null) {
            deadline = assignment.getDueDate().atTime(23, 59, 59);
        }
        if (deadline != null && LocalDateTime.now().isAfter(deadline)) {
            throw new IllegalStateException("Assignment deadline has expired (" + deadline + "). Submissions are closed.");
        }

        AssignmentSubmission submission = submissionRepository.findByAssignmentIdAndStudentId(req.getAssignmentId(), studentId).orElse(null);
        boolean isEdit = (submission != null);
        String previousPdf = isEdit ? submission.getPdfSubmissionUrl() : null;
        String previousContent = isEdit ? submission.getSubmissionContent() : null;

        if (submission != null) {
            // Check if resubmission / editing is allowed
            if (!submission.isCanEdit() && !assignment.isAllowResubmission()) {
                throw new IllegalStateException("Resubmission locked: Trainer permission is required to edit this submitted assignment.");
            }
        } else {
            submission = AssignmentSubmission.builder()
                    .assignmentId(req.getAssignmentId())
                    .studentId(studentId)
                    .studentName(studentName)
                    .institutionId(assignment.getInstitutionId())
                    .institutionName(assignment.getInstitutionName())
                    .canEdit(assignment.isAllowResubmission())
                    .build();
        }

        submission.setInstitutionId(assignment.getInstitutionId());
        submission.setInstitutionName(assignment.getInstitutionName());
        submission.setSubmissionType(req.getSubmissionType() != null ? req.getSubmissionType() : "PDF");
        submission.setSubmissionContent(req.getSubmissionContent());
        submission.setPdfSubmissionUrl(req.getPdfSubmissionUrl());
        submission.setStatus("SUBMITTED");
        submission.setSubmittedAt(LocalDateTime.now());

        AssignmentSubmission saved = submissionRepository.save(submission);

        // Record Audit Log for student action
        String actionType = isEdit ? "STUDENT_EDITED_SUBMISSION" : "STUDENT_INITIAL_SUBMISSION";
        String editSummary = isEdit 
                ? ("Edited PDF Deliverable. Previous: " + (previousPdf != null ? previousPdf : "None") + " -> New: " + (req.getPdfSubmissionUrl() != null ? req.getPdfSubmissionUrl() : "None"))
                : ("Initial PDF submission uploaded: " + (req.getPdfSubmissionUrl() != null ? req.getPdfSubmissionUrl() : "None"));

        auditLogRepository.save(AssignmentAuditLog.builder()
                .assignmentId(assignment.getId())
                .assignmentTitle(assignment.getTitle())
                .submissionId(saved.getId())
                .studentId(studentId)
                .studentName(studentName)
                .trainerId(assignment.getTrainerId())
                .trainerName(assignment.getTrainerName())
                .actionType(actionType)
                .permissionDetails(isEdit ? "Student modified submission under active trainer permission" : "First submission submitted by student")
                .editDetails(editSummary)
                .timestamp(LocalDateTime.now())
                .build());

        return saved;
    }

    @Transactional
    public AssignmentSubmission reviewSubmission(Long submissionId) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found: " + submissionId));

        if ("SUBMITTED".equalsIgnoreCase(submission.getStatus())) {
            submission.setStatus("UNDER_REVIEW");
            submission.setViewedByTrainerAt(LocalDateTime.now());
            return submissionRepository.save(submission);
        }
        return submission;
    }

    @Transactional
    public AssignmentSubmission evaluateSubmission(Long submissionId, GradeSubmissionRequest req, Long trainerId) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found: " + submissionId));

        submission.setScore(req.getScore());
        submission.setFeedback(req.getFeedback());
        submission.setGrade(req.getGrade() != null ? req.getGrade() : (req.getScore() >= 90 ? "A+" : req.getScore() >= 80 ? "A" : req.getScore() >= 70 ? "B" : "C"));
        submission.setStatus("CHECKED");
        submission.setEvaluatedByTrainerId(trainerId);
        submission.setEvaluatedAt(LocalDateTime.now());

        return submissionRepository.save(submission);
    }

    @Transactional
    public Assignment updateDeadline(Long assignmentId, String dueDateTime) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + assignmentId));
        assignment.setDueDateTime(parseDateTime(dueDateTime));
        return assignmentRepository.save(assignment);
    }

    @Transactional
    public Assignment toggleResubmission(Long assignmentId, boolean allow, Long trainerId, String trainerName) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + assignmentId));
        assignment.setAllowResubmission(allow);
        // Also update all existing submissions under this assignment
        List<AssignmentSubmission> submissions = submissionRepository.findByAssignmentId(assignmentId);
        for (AssignmentSubmission s : submissions) {
            s.setCanEdit(allow);
            submissionRepository.save(s);
        }

        // Record Audit Log for global permission toggle
        auditLogRepository.save(AssignmentAuditLog.builder()
                .assignmentId(assignment.getId())
                .assignmentTitle(assignment.getTitle())
                .trainerId(trainerId != null ? trainerId : assignment.getTrainerId())
                .trainerName(trainerName != null ? trainerName : assignment.getTrainerName())
                .actionType(allow ? "GLOBAL_PERMISSION_ENABLED" : "GLOBAL_PERMISSION_DISABLED")
                .permissionDetails(allow 
                        ? "Trainer enabled resubmission & editing for ALL students in this assignment" 
                        : "Trainer locked resubmission & editing for ALL students in this assignment")
                .editDetails("Scope: Entire cohort for assignment \"" + assignment.getTitle() + "\"")
                .timestamp(LocalDateTime.now())
                .build());

        return assignmentRepository.save(assignment);
    }

    @Transactional
    public AssignmentSubmission toggleStudentCanEdit(Long submissionId, boolean allow, Long trainerId, String trainerName) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found: " + submissionId));
        submission.setCanEdit(allow);
        AssignmentSubmission saved = submissionRepository.save(submission);

        Assignment assignment = assignmentRepository.findById(submission.getAssignmentId()).orElse(null);
        String assignTitle = assignment != null ? assignment.getTitle() : "Assignment #" + submission.getAssignmentId();

        // Record Audit Log for specific student permission toggle
        auditLogRepository.save(AssignmentAuditLog.builder()
                .assignmentId(submission.getAssignmentId())
                .assignmentTitle(assignTitle)
                .submissionId(submission.getId())
                .studentId(submission.getStudentId())
                .studentName(submission.getStudentName())
                .trainerId(trainerId != null ? trainerId : (assignment != null ? assignment.getTrainerId() : null))
                .trainerName(trainerName != null ? trainerName : (assignment != null ? assignment.getTrainerName() : "Faculty Trainer"))
                .actionType(allow ? "PERMISSION_GRANTED" : "PERMISSION_REVOKED")
                .permissionDetails(allow 
                        ? ("Trainer granted edit permission to student: " + submission.getStudentName()) 
                        : ("Trainer revoked edit permission for student: " + submission.getStudentName()))
                .editDetails("Permission Status: " + (allow ? "Student can re-upload / edit submission" : "Editing locked for student"))
                .timestamp(LocalDateTime.now())
                .build());

        return saved;
    }

    @Transactional
    public Assignment updateAssignment(Long assignmentId, CreateAssignmentRequest req) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + assignmentId));
        if (req.getTitle() != null && !req.getTitle().isBlank()) {
            assignment.setTitle(req.getTitle().trim());
        }
        if (req.getDescription() != null) {
            assignment.setDescription(req.getDescription().trim());
        }
        if (req.getSubjectName() != null && !req.getSubjectName().isBlank()) {
            assignment.setSubjectName(req.getSubjectName().trim());
        }
        if (req.getDueDateTime() != null && !req.getDueDateTime().isBlank()) {
            assignment.setDueDateTime(parseDateTime(req.getDueDateTime()));
        }
        if (req.getMaxScore() > 0) {
            assignment.setMaxScore(req.getMaxScore());
        }
        if (req.getPdfAttachmentUrl() != null) {
            assignment.setPdfAttachmentUrl(req.getPdfAttachmentUrl().trim());
        }
        assignment.setAssignedToAll(req.isAssignedToAll());
        if (req.getAssignedStudentIds() != null) {
            assignment.setAssignedStudentIds(req.getAssignedStudentIds());
        }
        assignment.setAllowResubmission(req.isAllowResubmission());
        return assignmentRepository.save(assignment);
    }

    @Transactional
    public void deleteAssignment(Long assignmentId) {
        List<AssignmentSubmission> submissions = submissionRepository.findByAssignmentId(assignmentId);
        submissionRepository.deleteAll(submissions);
        assignmentRepository.deleteById(assignmentId);
    }

    public List<AssignmentSubmission> getSubmissionsForAssignment(Long assignmentId) {
        return submissionRepository.findByAssignmentId(assignmentId);
    }

    public List<AssignmentAuditLog> getAuditLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    public List<AssignmentAuditLog> getAuditLogsByAssignment(Long assignmentId) {
        return auditLogRepository.findByAssignmentIdOrderByTimestampDesc(assignmentId);
    }
}
