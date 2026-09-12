package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exam_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long examId;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String questionType = "MCQ"; // "MCQ" or "CODING"

    // MCQ Fields
    @Column(columnDefinition = "TEXT")
    private String questionText;

    @Column(columnDefinition = "TEXT")
    private String optionA;

    @Column(columnDefinition = "TEXT")
    private String optionB;

    @Column(columnDefinition = "TEXT")
    private String optionC;

    @Column(columnDefinition = "TEXT")
    private String optionD;

    @Column(length = 5)
    private String correctOption; // 'A', 'B', 'C', 'D'

    @Builder.Default
    private int marks = 10;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    // Coding Problem Fields
    @Column(length = 200)
    private String problemTitle;

    @Column(columnDefinition = "TEXT")
    private String problemDescription;

    @Column(columnDefinition = "TEXT")
    private String inputFormat;

    @Column(columnDefinition = "TEXT")
    private String outputFormat;

    @Column(columnDefinition = "TEXT")
    private String constraints;

    @Column(columnDefinition = "TEXT")
    private String starterCodeJson; // JSON mapping: {"c": "...", "cpp": "...", "java": "...", "python": "...", "csharp": "...", "kotlin": "..."}

    @Column(length = 150)
    @Builder.Default
    private String allowedLanguages = "c,cpp,java,python,csharp,kotlin";

    @Builder.Default
    private int timeLimitSeconds = 5;

    @Builder.Default
    private int memoryLimitMb = 256;
}
