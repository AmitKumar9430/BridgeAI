package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_teams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTeam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long topicId;

    @Column(nullable = false, length = 100)
    private String teamName;

    @Column(nullable = false)
    private Long leaderId;

    @Column(length = 100)
    private String leaderName;

    private Long institutionId;

    @Column(length = 150)
    private String institutionName;

    @Column(length = 1000)
    private String zipFileUrl;

    @Column(length = 1000)
    private String pptFileUrl;

    @Column(length = 1000)
    private String pdfReportUrl;

    @Column(length = 1000)
    private String githubRepoUrl;

    @Column(length = 1000)
    private String liveDemoUrl;

    @Column(columnDefinition = "LONGTEXT")
    private String studentComments;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "FORMING"; // FORMING, IN_PROGRESS, SUBMITTED, EVALUATED

    private Integer score;

    @Column(columnDefinition = "LONGTEXT")
    private String feedback;

    @Column(length = 100)
    private String lastUpdatedByName;

    private LocalDateTime lastUpdatedAt;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
