package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long examId;

    @Column(nullable = false)
    private Long studentId;

    @Column(length = 100)
    private String studentName;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime startedAt = LocalDateTime.now();

    private LocalDateTime completedAt;

    @Builder.Default
    private int score = 0;

    @Builder.Default
    private int totalMarks = 0;

    @Builder.Default
    private double percentage = 0.0;

    @Builder.Default
    private boolean passed = false;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "IN_PROGRESS"; // IN_PROGRESS, SUBMITTED, TERMINATED_BY_VIOLATION

    @Builder.Default
    private int violationCount = 0;

    @Column(length = 500)
    private String recordingSnapshotUrl;

    @Column(length = 100)
    private String certificateCode;

    @Builder.Default
    private boolean canReattempt = false;
}
