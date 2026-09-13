package com.bridgeai.portal.dto;

import com.bridgeai.portal.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.Map;

public class AuthDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RegisterRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Valid email is required")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        @NotBlank(message = "Full name is required")
        private String fullName;

        private String phone;

        private Role role; // Defaults to ROLE_STUDENT if null

        private Long institutionId;
        private String institutionName;

        @NotBlank(message = "OTP code is required for registration verification")
        private String otpCode;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SendOtpRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Valid email is required")
        private String email;

        @NotBlank(message = "Purpose is required (REGISTRATION, LOGIN, FORGOT_PASSWORD)")
        private String purpose;

        private String fullName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VerifyOtpRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Valid email is required")
        private String email;

        @NotBlank(message = "OTP code is required")
        private String otpCode;

        @NotBlank(message = "Purpose is required")
        private String purpose;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginPasswordOtpRequest {
        @NotBlank(message = "Email is required")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;

        private String otpCode; // Required if 2FA or OTP verification is triggered
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginOtpOnlyRequest {
        @NotBlank(message = "Email is required")
        private String email;

        @NotBlank(message = "OTP code is required")
        private String otpCode;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResetPasswordRequest {
        @NotBlank(message = "Email is required")
        private String email;

        @NotBlank(message = "OTP code is required")
        private String otpCode;

        @NotBlank(message = "New password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String newPassword;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserDto {
        private Long id;
        private String email;
        private String fullName;
        private String phone;
        private String staffId;
        private Role role;
        private boolean active;
        private String avatarUrl;
        private Long institutionId;
        private String institutionName;
        private String assignedSubject;
        private Long superAdminId;
        private String superAdminName;
        private java.time.LocalDateTime createdAt;
        private java.time.LocalDateTime lastLoginAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthResponse {
        private String token;
        private UserDto user;
        private String message;
        private boolean requiresOtp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OtpDispatchPayload {
        private String serviceId;
        private String templateId;
        private String publicKey;
        private String otpCode;
        private Map<String, Object> templateParams;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateUserRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Valid email is required")
        private String email;

        @NotBlank(message = "Full name is required")
        private String fullName;

        private String phone;

        private String password;

        private String details;

        private Long institutionId;

        private String institutionName;

        private String assignedSubject;

        private Long superAdminId;

        private String superAdminName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DemoLoginRequest {
        @NotBlank(message = "Role is required")
        private String role;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AppointVigilanceOfficerRequest {
        @NotBlank(message = "Full name is required")
        private String fullName;

        @NotBlank(message = "Official email is required")
        @Email(message = "Valid official email is required")
        private String email;

        private String phone;

        @NotBlank(message = "Staff ID is required")
        private String staffId; // e.g. VO-001

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        @Builder.Default
        private boolean active = true;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResetOfficerPasswordRequest {
        @NotBlank(message = "New password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String newPassword;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChangePasswordRequest {
        private String currentPassword; // Optional if verified or if initial temp password

        @NotBlank(message = "New password is required")
        @Size(min = 6, message = "New password must be at least 6 characters")
        private String newPassword;

        private String confirmPassword;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateBossCredentialsRequest {
        private String fullName;
        private String email;
        private String phone;
        private String currentPassword;
        private String newPassword;
        private String confirmPassword;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VigilanceActionRequest {
        private Long studentId;
        private String studentName;
        private String studentEmail;
        private Long examId;
        private String examTitle;
        private Long attemptId;
        @NotBlank(message = "Action type is required (ISSUE_WARNING, TERMINATE_EXAM, FLAG_SUSPICIOUS)")
        private String actionType;
        private String severity;
        private String reason;
        private String officerNotes;
        private String evidenceId;
        private String evidenceSnapshot;
        private String chatMessage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EvidenceCaptureRequest {
        private Long attemptId;
        private Long studentId;
        private String studentName;
        private Long examId;
        private String examTitle;
        private String reason;
        private String evidenceSnapshot; // Base64 snapshot
        private String officerNotes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SendChatRequest {
        private Long attemptId;
        private Long studentId;
        private String studentName;
        private Long examId;
        private String message;
    }
}
