package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exam_coding_test_cases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamCodingTestCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long questionId;

    @Column(columnDefinition = "TEXT")
    private String input;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String expectedOutput;

    @Builder.Default
    private boolean sample = false; // true = visible sample testcase; false = hidden evaluation testcase

    @Column(columnDefinition = "TEXT")
    private String explanation;
}
