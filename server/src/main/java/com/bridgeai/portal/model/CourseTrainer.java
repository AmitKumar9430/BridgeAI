package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "course_trainers",
       uniqueConstraints = @UniqueConstraint(columnNames = {"course_id", "trainer_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseTrainer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(name = "trainer_id", nullable = false)
    private Long trainerId;

    @Column(length = 100)
    private String trainerName;

    @Column(length = 100)
    private String trainerEmail;

    @Column(length = 150)
    private String trainerSpecialization;

    @Column(length = 150)
    private String courseTitle;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime assignedAt = LocalDateTime.now();
}
