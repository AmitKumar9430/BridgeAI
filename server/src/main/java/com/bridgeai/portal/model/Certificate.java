package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String certificateCode; // e.g., BAI-2026-X99F

    @Column(nullable = false)
    private Long studentId;

    @Column(nullable = false, length = 120)
    private String studentName;

    @Column(nullable = false, length = 150)
    private String courseTitle;

    @Column(nullable = false)
    private Long examId;

    @Builder.Default
    private double gradePercentage = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private LocalDate issueDate = LocalDate.now();

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
