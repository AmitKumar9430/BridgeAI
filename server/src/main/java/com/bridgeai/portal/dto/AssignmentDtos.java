package com.bridgeai.portal.dto;

import com.bridgeai.portal.model.Assignment;
import com.bridgeai.portal.model.AssignmentSubmission;
import lombok.*;

public class AssignmentDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateAssignmentRequest {
        private Long courseId;
        private String title;
        private String description;
        private String subjectName;
        private String dueDateTime;
        private Integer maxScore;
        private String pdfAttachmentUrl;
        private boolean assignedToAll;
        private String assignedStudentIds;
        private boolean allowResubmission;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateDeadlineRequest {
        private String dueDateTime;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssignmentWithSubmissionDto {
        private Assignment assignment;
        private AssignmentSubmission mySubmission;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SubmitAssignmentRequest {
        private Long assignmentId;
        private String submissionType; // PDF, FILE_UPLOAD, GITHUB_LINK, TEXT_RESPONSE
        private String submissionContent;
        private String pdfSubmissionUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GradeSubmissionRequest {
        private Integer score;
        private String feedback;
        private String grade;
        private String status; // CHECKED, UNDER_REVIEW, EVALUATED
    }
}
