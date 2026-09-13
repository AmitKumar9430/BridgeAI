package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exam_answers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long attemptId;

    @Column(nullable = false)
    private Long questionId;

    @Column(length = 20)
    @Builder.Default
    private String questionType = "MCQ"; // "MCQ" or "CODING"

    // MCQ Fields
    @Column(length = 255)
    private String selectedOption; // 'A', 'B', 'C', 'D'

    @Builder.Default
    private boolean correct = false;

    @Builder.Default
    private int marksAwarded = 0;

    // Coding Fields
    @Column(columnDefinition = "TEXT")
    private String submittedCode;

    @Column(length = 30)
    private String selectedLanguage; // "c", "cpp", "java", "python", "csharp", "kotlin"

    @Builder.Default
    private int testCasesPassed = 0;

    @Builder.Default
    private int totalTestCases = 0;

    @Column(columnDefinition = "TEXT")
    private String compilerOutput;

    @Column(columnDefinition = "TEXT")
    private String executionDetailsJson; // JSON array of test case results
}
