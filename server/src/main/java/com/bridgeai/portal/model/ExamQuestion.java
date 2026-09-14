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

    @Column(length = 255)
    private String correctOption; // 'A', 'B', 'C', 'D'

    public static String normalizeCorrectOption(String raw, String optA, String optB, String optC, String optD) {
        if (raw == null || raw.trim().isEmpty()) {
            return "A";
        }
        String s = raw.trim();

        // Exactly A, B, C, D
        if (s.equalsIgnoreCase("A")) return "A";
        if (s.equalsIgnoreCase("B")) return "B";
        if (s.equalsIgnoreCase("C")) return "C";
        if (s.equalsIgnoreCase("D")) return "D";

        String upper = s.toUpperCase();

        // "Option A", "Option B", "Choice A", "Answer A", etc.
        if (upper.startsWith("OPTION") || upper.startsWith("CHOICE") || upper.startsWith("ANSWER")) {
            String stripped = upper.replace("OPTION", "")
                    .replace("CHOICE", "")
                    .replace("ANSWER", "")
                    .replace(":", "")
                    .replace("-", "")
                    .trim();
            if (stripped.startsWith("A") || stripped.equals("1")) return "A";
            if (stripped.startsWith("B") || stripped.equals("2")) return "B";
            if (stripped.startsWith("C") || stripped.equals("3")) return "C";
            if (stripped.startsWith("D") || stripped.equals("4")) return "D";
        }

        // Numeric indices 1, 2, 3, 4
        if (s.equals("1")) return "A";
        if (s.equals("2")) return "B";
        if (s.equals("3")) return "C";
        if (s.equals("4")) return "D";

        // Brackets or prefixes like "[A]", "(A)", "A)", "A.", "A -", "[A] - text"
        if (upper.matches("^[\\(\\[][A-D][\\)\\]]?.*")) {
            return String.valueOf(upper.charAt(1));
        }
        if (upper.matches("^[A-D][\\)\\.\\:\\-\\s].*")) {
            return String.valueOf(upper.charAt(0));
        }

        // Match against option texts (exact or prefix/substring)
        String sLower = s.toLowerCase();
        if (optA != null && !optA.trim().isEmpty()) {
            String oA = optA.trim().toLowerCase();
            if (sLower.equals(oA) || oA.startsWith(sLower) || sLower.startsWith(oA)) return "A";
        }
        if (optB != null && !optB.trim().isEmpty()) {
            String oB = optB.trim().toLowerCase();
            if (sLower.equals(oB) || oB.startsWith(sLower) || sLower.startsWith(oB)) return "B";
        }
        if (optC != null && !optC.trim().isEmpty()) {
            String oC = optC.trim().toLowerCase();
            if (sLower.equals(oC) || oC.startsWith(sLower) || sLower.startsWith(oC)) return "C";
        }
        if (optD != null && !optD.trim().isEmpty()) {
            String oD = optD.trim().toLowerCase();
            if (sLower.equals(oD) || oD.startsWith(sLower) || sLower.startsWith(oD)) return "D";
        }

        // If it begins with A, B, C, D
        if (upper.startsWith("A")) return "A";
        if (upper.startsWith("B")) return "B";
        if (upper.startsWith("C")) return "C";
        if (upper.startsWith("D")) return "D";

        // Safe fallback to 'A'
        return "A";
    }

    @Builder.Default
    private int marks = 10;

    @Column(columnDefinition = "LONGTEXT")
    private String explanation;

    // Coding Problem Fields
    @Column(length = 200)
    private String problemTitle;

    @Column(columnDefinition = "LONGTEXT")
    private String problemDescription;

    @Column(columnDefinition = "TEXT")
    private String inputFormat;

    @Column(columnDefinition = "TEXT")
    private String outputFormat;

    @Column(columnDefinition = "TEXT")
    private String constraints;

    @Column(columnDefinition = "LONGTEXT")
    private String starterCodeJson; // JSON mapping: {"c": "...", "cpp": "...", "java": "...", "python": "...", "csharp": "...", "kotlin": "..."}

    @Column(length = 150)
    @Builder.Default
    private String allowedLanguages = "c,cpp,java,python,csharp,kotlin";

    @Builder.Default
    private int timeLimitSeconds = 5;

    @Builder.Default
    private int memoryLimitMb = 256;
}
