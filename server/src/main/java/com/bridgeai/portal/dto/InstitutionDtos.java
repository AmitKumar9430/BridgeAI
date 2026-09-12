package com.bridgeai.portal.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class InstitutionDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InstitutionDto {
        private Long id;
        private String name;
        private String code;
        private String category;
        private String accreditation;
        private String contactEmail;
        private String contactPhone;
        private String websiteUrl;
        private Integer establishedYear;
        // Location details
        private String campusAddress;
        private String city;
        private String state;
        private String postalCode;
        private String country;
        private String status;
        private int maxStrikesAllowed;
        private String description;
        private String logoUrl;
        private LocalDateTime createdAt;

        // Calculated statistics
        private int superAdminCount;
        private int trainerCount;
        private int studentCount;
        private int courseCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EnrollInstitutionRequest {
        @NotBlank(message = "Institution name is required")
        private String name;

        private String code;
        private String category;
        private String accreditation;
        private String contactEmail;
        private String contactPhone;
        private String websiteUrl;
        private Integer establishedYear;

        // Location Details
        @NotBlank(message = "Campus address is required")
        private String campusAddress;

        @NotBlank(message = "City is required")
        private String city;

        @NotBlank(message = "State is required")
        private String state;

        private String postalCode;
        private String country;
        private String description;
        private Integer maxStrikesAllowed; // Decided by Boss Admin (default 3)

        // Optional Initial Super Admin Provisioning
        private String superAdminFullName;
        private String superAdminEmail;
        private String superAdminPhone;
        private String superAdminPassword;
        private String superAdminDesignation;

        // Running subjects / courses under this institution
        private List<InitialSubjectItem> initialSubjects;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InitialSubjectItem {
        private String title;
        private String category;
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HierarchyTrainerNode {
        private Long id;
        private String fullName;
        private String email;
        private String phone;
        private String assignedSubject;
        private String domainSpecialization;
        private Long superAdminId;
        private String superAdminName;
        private boolean active;
        private List<Map<String, Object>> courses;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HierarchySuperAdminNode {
        private Long id;
        private String fullName;
        private String email;
        private String phone;
        private boolean active;
        private String institutionName;
        private List<HierarchyTrainerNode> trainers;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HierarchyInstitutionNode {
        private Long id;
        private String name;
        private String code;
        private String category;
        private String accreditation;
        private String campusAddress;
        private String city;
        private String state;
        private String postalCode;
        private String country;
        private String contactEmail;
        private String contactPhone;
        private String websiteUrl;
        private Integer establishedYear;
        private String status;
        private int maxStrikesAllowed;
        private int totalSuperAdmins;
        private int totalTrainers;
        private int totalStudents;
        private int totalCourses;
        private List<Map<String, Object>> subjects;
        private List<HierarchySuperAdminNode> superAdmins;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserFullProfileDto {
        private Long id;
        private String fullName;
        private String email;
        private String phone;
        private String role;
        private boolean active;
        private String institutionName;
        private String assignedSubject;
        private Long superAdminId;
        private String superAdminName;
        private String avatarUrl;
        private LocalDateTime createdAt;
        private LocalDateTime lastLoginAt;

        // Role-Specific metadata
        private Map<String, Object> metadata;
        private List<Map<String, Object>> relatedItems;
    }
}
