package com.bridgeai.portal.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

public class ExamDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CodingTestCaseDto {
        private Long id;
        private String input;
        private String expectedOutput;
        private boolean sample;
        private String explanation;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CodingTestCasePublicDto {
        private Long id;
        private String input;
        private String expectedOutput;
        private String explanation;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TestCaseExecutionResultDto {
        private Long id;
        private String input;
        private String expectedOutput;
        private String actualOutput;
        private boolean passed;
        private long executionTimeMs;
        private String error;
        private boolean sample;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RunCodeRequest {
        private String language;
        private String code;
        private Long questionId;
        private String customInput;
        private List<CodingTestCaseDto> sampleTestCases;
        private int timeLimitSeconds;
        private boolean evaluateAll;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RunCodeResponse {
        private String status; // "SUCCESS", "COMPILATION_ERROR", "RUNTIME_ERROR", "TIME_LIMIT_EXCEEDED"
        private boolean compiled;
        private String compilerError;
        private String compilerOutput;
        private String customOutput;
        private int passedCount;
        private int totalCount;
        private long totalExecutionTimeMs;
        private List<TestCaseExecutionResultDto> testCaseResults;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CodingSubmissionDto {
        private Long questionId;
        private String language;
        private String code;
        private String selectedLanguage;
        private String submittedCode;

        public String getLanguage() {
            return (language != null && !language.isEmpty()) ? language : selectedLanguage;
        }

        public String getCode() {
            return (code != null && !code.isEmpty()) ? code : submittedCode;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionPublicDto {
        private Long id;
        @Builder.Default
        private String questionType = "MCQ"; // "MCQ" or "CODING"
        private String questionText;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
        private int marks;

        // Coding Problem Details
        private String problemTitle;
        private String problemDescription;
        private String inputFormat;
        private String outputFormat;
        private String constraints;
        private String starterCodeJson;
        private String allowedLanguages;
        private int timeLimitSeconds;
        private int memoryLimitMb;
        private List<CodingTestCasePublicDto> sampleTestCases;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StartExamResponse {
        private Long attemptId;
        private Long examId;
        private String examTitle;
        private String courseTitle;
        private int durationMinutes;
        private int totalMarks;
        private int maxViolations;
        private int maxStrikesAllowed;
        private String assessmentType;
        private boolean allowMultipleAttempts;
        private String institutionName;
        private List<QuestionPublicDto> questions;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SubmitExamRequest {
        private Long attemptId;
        private Map<Long, String> answers; // questionId -> selectedOption ('A','B','C','D')
        private Map<Long, CodingSubmissionDto> codingAnswers; // questionId -> CodingSubmissionDto
        private List<CodingSubmissionDto> codingSubmissions;
        private String snapshotBase64;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ViolationReportRequest {
        private Long attemptId;
        private String violationType; // TAB_SWITCH, FULLSCREEN_EXIT, COPY_PASTE, RIGHT_CLICK, DEVTOOLS_OPEN
        private String details;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AnswerBreakdownDto {
        private Long questionId;
        @Builder.Default
        private String questionType = "MCQ"; // "MCQ" or "CODING"
        private String questionText;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
        private String selectedOption;
        private String correctOption;
        private boolean correct;
        private int marksAwarded;
        private int maxMarks;
        private String explanation;

        // Coding Breakdown
        private String problemTitle;
        private String submittedCode;
        private String selectedLanguage;
        private int testCasesPassed;
        private int totalTestCases;
        private String compilerOutput;
        private List<TestCaseExecutionResultDto> testCaseResults;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExamResultResponse {
        private Long attemptId;
        private Long examId;
        private String examTitle;
        private String studentName;
        private int score;
        private int totalMarks;
        private double percentage;
        private boolean passed;
        private int violationCount;
        private String status; // SUBMITTED, TERMINATED_BY_VIOLATION, MISSED
        private String certificateCode;
        private boolean canReattempt;
        private String assessmentType;
        private boolean allowMultipleAttempts;
        private String institutionName;
        private List<AnswerBreakdownDto> breakdowns;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExamAttemptDto {
        private Long id;
        private Long examId;
        private String examTitle;
        private Long studentId;
        private String studentName;
        private java.time.LocalDateTime startedAt;
        private java.time.LocalDateTime completedAt;
        private int score;
        private int totalMarks;
        private double percentage;
        private boolean passed;
        private String status;
        private int violationCount;
        private boolean canReattempt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateQuestionDto {
        @Builder.Default
        private String questionType = "MCQ"; // "MCQ" or "CODING"
        private String questionText;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
        private String correctOption; // 'A', 'B', 'C', 'D'
        private int marks;
        private String explanation;

        // Coding Problem Fields
        private String problemTitle;
        private String problemDescription;
        private String inputFormat;
        private String outputFormat;
        private String constraints;
        private String starterCodeJson;
        private String allowedLanguages;
        private int timeLimitSeconds;
        private int memoryLimitMb;
        private List<CodingTestCaseDto> testCases;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ScheduleExamRequest {
        private Long courseId;
        private Long moduleId;
        private String title;
        private String description;
        private String instructions;
        private int durationMinutes;
        private int passingPercentage;
        private int maxViolations;
        private int totalMarks;
        private java.time.LocalDateTime scheduledStartTime;
        private java.time.LocalDateTime scheduledEndTime;
        private String trainerName;
        private String assessmentType;
        private Long institutionId;
        private String institutionName;
        private boolean allowMultipleAttempts;
        private List<CreateQuestionDto> questions;
    }
}
