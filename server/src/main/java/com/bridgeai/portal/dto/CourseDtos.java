package com.bridgeai.portal.dto;

import com.bridgeai.portal.model.Course;
import com.bridgeai.portal.model.CourseModule;
import com.bridgeai.portal.model.CourseTrainer;
import com.bridgeai.portal.model.Exam;
import com.bridgeai.portal.model.ResourceItem;
import com.bridgeai.portal.dto.ExamDtos.CreateQuestionDto;
import lombok.*;

import java.util.List;

public class CourseDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ModuleWithResourcesDto {
        private CourseModule module;
        private List<ResourceItem> resources;
        private Exam moduleExam;
        private int questionCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CourseDetailDto {
        private Course course;
        private List<ModuleWithResourcesDto> modules;
        private int assignmentCount;
        private int liveSessionCount;
        private List<CourseTrainer> assignedTrainers;
        private Exam courseExam;
        private int totalExamQuestions;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudyMaterialUploadDto {
        private Long courseId;
        private Long moduleId;
        private String title;
        private String resourceType;
        private String urlOrPath;
        private String fileSize;
        private String description;
        private String richContent;
        private String videoEmbedUrl;
        private String imageUrls;
        private int orderIndex;

        // Visibility Scope: GLOBAL, INSTITUTION, BOTH
        private String visibilityScope;
        private Boolean isGlobal;
        private Boolean isInstitution;
        private Long institutionId;
        private String institutionName;

        // Attached Module Test / Assessment Questions
        private boolean includeModuleTest;
        private String testTitle;
        private String testDescription;
        private int durationMinutes;
        private int passingPercentage;
        private List<CreateQuestionDto> questions;
    }
}
