package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long courseId;

    private Long moduleId;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Long trainerId;

    @Column(length = 100)
    private String trainerName;

    @Column(length = 150)
    private String subjectName;

    private LocalDate dueDate;

    private LocalDateTime dueDateTime;

    @Column(length = 500)
    private String attachmentUrl;

    @Column(length = 500)
    private String pdfAttachmentUrl;

    @Builder.Default
    private boolean assignedToAll = true;

    @Column(columnDefinition = "TEXT")
    private String assignedStudentIds; // e.g. "4,8,12" if assignedToAll is false

    @Builder.Default
    private boolean allowResubmission = false;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String submissionType = "PDF"; // PDF, FILE_UPLOAD, GITHUB_LINK, TEXT_RESPONSE

    @Builder.Default
    private int maxScore = 100;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
