package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assignment_submissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long assignmentId;

    @Column(nullable = false)
    private Long studentId;

    @Column(length = 100)
    private String studentName;

    @Column(length = 30)
    private String submissionType; // FILE_UPLOAD, GITHUB_LINK, TEXT_RESPONSE

    @Column(columnDefinition = "TEXT")
    private String submissionContent; // Link or text

    @Column(length = 500)
    private String pdfSubmissionUrl;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "SUBMITTED"; // SUBMITTED, UNDER_REVIEW, CHECKED

    @Builder.Default
    private boolean canEdit = false; // Enabled if trainer allows resubmission

    private Integer score;

    @Column(length = 20)
    private String grade;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    private Long evaluatedByTrainerId;

    private LocalDateTime viewedByTrainerAt;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime submittedAt = LocalDateTime.now();

    private LocalDateTime evaluatedAt;
}
