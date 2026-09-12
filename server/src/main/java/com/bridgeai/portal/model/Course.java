package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 60)
    private String category;

    private Long trainerId;

    @Column(length = 100)
    private String trainerName;

    @Column(length = 20)
    private String badgeColor; // Pure solid color code (e.g. #0F172A, #2563EB, #059669)

    @Column
    private Long institutionId;

    @Column(length = 150)
    private String institutionName; // Associated educational institution

    private LocalDate startDate;
    private LocalDate endDate;

    @Builder.Default
    private int enrolledCount = 0;

    @Builder.Default
    private int progressPercentage = 0;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
