package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "resource_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long courseId;

    private Long moduleId;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 20, nullable = false)
    private String resourceType; // PDF, PPT, DOC, EXCEL, IMAGE, VIDEO, LINK, GITHUB

    @Column(length = 500)
    @Builder.Default
    private String urlOrPath = "#";

    @Column(length = 50)
    private String fileSize;

    @Column(length = 255)
    private String description;

    @Column(columnDefinition = "LONGTEXT")
    private String richContent;

    @Column(length = 500)
    private String videoEmbedUrl;

    @Column(columnDefinition = "TEXT")
    private String imageUrls;

    @Builder.Default
    private int orderIndex = 0;

    @Column(length = 20)
    @Builder.Default
    private String visibilityScope = "BOTH"; // GLOBAL, INSTITUTION, BOTH

    private Long institutionId;

    @Column(length = 150)
    private String institutionName;

    private Long uploaderTrainerId;

    @Column(length = 100)
    private String uploaderTrainerName;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
