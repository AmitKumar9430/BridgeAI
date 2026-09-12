package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exam {

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

    @Column(columnDefinition = "TEXT")
    private String instructions;

    private Long trainerId;

    @Column(length = 100)
    private String trainerName;

    private LocalDateTime scheduledStartTime;

    private LocalDateTime scheduledEndTime;

    @Builder.Default
    private int durationMinutes = 45;

    @Builder.Default
    private int passingPercentage = 60;

    @Builder.Default
    private int maxViolations = 3;

    @Builder.Default
    private int totalMarks = 100;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean randomizeQuestions = true;

    @Column(length = 50)
    @Builder.Default
    private String assessmentType = "TRAINER_ASSIGNED"; // "TRAINER_ASSIGNED" or "SELF_ASSESSMENT"

    private Long institutionId;

    @Column(length = 150)
    private String institutionName;

    @Builder.Default
    private boolean allowMultipleAttempts = false;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
