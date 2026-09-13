package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectWork {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long courseId;

    private Long studentId;

    @Column(length = 100)
    private String studentName;

    private Long trainerId;

    @Column(length = 100)
    private String trainerName;

    @Column(length = 150)
    private String subjectName;

    @Column(length = 150)
    private String institutionName;

    private Long institutionId;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    private LocalDate deadline;

    @Builder.Default
    private int minTeamSize = 2;

    @Builder.Default
    private int maxTeamSize = 4;

    @Column(length = 255)
    private String teamMembers;

    @Column(length = 500)
    private String githubRepoUrl;

    @Column(length = 500)
    private String documentationUrl;

    @Column(length = 500)
    private String liveDemoUrl;

    @Column(length = 500)
    private String zipFileUrl;

    @Column(length = 500)
    private String pptFileUrl;

    @Column(length = 500)
    private String pdfReportUrl;

    @Builder.Default
    private boolean availableForSelection = true;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "AVAILABLE"; // AVAILABLE, IN_PROGRESS, SUBMITTED, EVALUATED

    private Integer score;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
