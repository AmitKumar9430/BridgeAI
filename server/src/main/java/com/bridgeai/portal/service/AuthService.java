package com.bridgeai.portal.service;

import com.bridgeai.portal.dto.AuthDtos.*;
import com.bridgeai.portal.model.Role;
import com.bridgeai.portal.model.User;
import com.bridgeai.portal.repository.UserRepository;
import com.bridgeai.portal.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import com.bridgeai.portal.model.Institution;
import com.bridgeai.portal.repository.InstitutionRepository;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final InstitutionRepository institutionRepository;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuditLogService auditLogService;

    public List<java.util.Map<String, Object>> getPublicInstitutions() {
        return institutionRepository.findAll().stream()
                .map(inst -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", inst.getId());
                    map.put("name", inst.getName());
                    map.put("code", inst.getCode());
                    map.put("category", inst.getCategory());
                    map.put("campusAddress", inst.getCampusAddress());
                    map.put("city", inst.getCity());
                    map.put("state", inst.getState());
                    map.put("postalCode", inst.getPostalCode());
                    return map;
                })
                .toList();
    

    }
    @Transactional
    public AuthResponse registerStudent(RegisterRequest request, String ip) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("An account with email " + email + " already exists.");
        }

        // Verify OTP (Registration is strictly OTP-verified)
        boolean verified = otpService.verifyOtp(email, request.getOtpCode(), "REGISTRATION");
        if (!verified) {
            throw new IllegalArgumentException("Invalid or expired OTP code for registration.");
        }
        // Rule: Public self-registration is strictly for students only!
        Role role = Role.ROLE_STUDENT;

        Institution institution = null;
        if (request.getInstitutionId() != null) {
            institution = institutionRepository.findById(request.getInstitutionId()).orElse(null);
        }
        if (institution == null && request.getInstitutionName() != null && !request.getInstitutionName().isBlank()) {
            institution = institutionRepository.findByName(request.getInstitutionName().trim()).orElse(null);
        }

        Long instId = institution != null ? institution.getId() : request.getInstitutionId();
        String instName = institution != null ? institution.getName() 
                : (request.getInstitutionName() != null && !request.getInstitutionName().isBlank() ? request.getInstitutionName().trim() : "Main Institute of Technology");

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(role)
                .institutionId(instId)
                .institutionName(instName)
                .active(true)
                .createdAt(LocalDateTime.now())
                .lastLoginAt(LocalDateTime.now())
                .build();

        userRepository.save(user);
        auditLogService.log(email, role.name(), "STUDENT_REGISTERED", "User", user.getId(), "Student self-registered via verified EmailJS OTP", ip);

        String token = tokenProvider.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .user(toDto(user))
                .message("Registration successful!")
                .build();
    

    }
    @Transactional
    public AuthResponse loginWithPasswordAndOtp(LoginPasswordOtpRequest request, String ip) {
        String identifier = request.getEmail().trim();
        User user = userRepository.findByEmail(identifier.toLowerCase())
                .or(() -> userRepository.findByStaffId(identifier))
                .or(() -> userRepository.findByStaffId(identifier.toUpperCase()))
                .orElseThrow(() -> new BadCredentialsException("Invalid email/Staff ID or password."));

        if (!user.isActive()) {
            throw new BadCredentialsException("Account is inactive or locked. Please contact administrator.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password.");
        }

        // If OTP is provided, verify it
        if (request.getOtpCode() != null && !request.getOtpCode().isBlank()) {
            boolean verified = otpService.verifyOtp(user.getEmail(), request.getOtpCode(), "LOGIN");
            if (!verified) {
                throw new BadCredentialsException("Invalid or expired OTP code.");
            }
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
        auditLogService.log(user.getEmail(), user.getRole().name(), "LOGIN_PASSWORD_SUCCESS", "User", user.getId(), "Password login successful", ip);

        String token = tokenProvider.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .user(toDto(user))
                .message("Login successful!")
                .build();
    

    }
    @Transactional
    public AuthResponse loginWithOtpOnly(LoginOtpOnlyRequest request, String ip) {
        String email = request.getEmail().trim().toLowerCase();

        // 1. Verify OTP first (Rule: Valid OTP proves email ownership)
        boolean verified = otpService.verifyOtp(email, request.getOtpCode(), "LOGIN");
        if (!verified) {
            throw new BadCredentialsException("Invalid or expired OTP passcode. Please check your email or request a new code.");
        }

        // 2. Find user or auto-register student upon verified email ownership
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            String rawName = email.split("@")[0].replace(".", " ").replace("_", " ");
            String[] parts = rawName.split("\\s+");
            StringBuilder sb = new StringBuilder();
            for (String p : parts) {
                if (!p.isEmpty()) {
                    sb.append(Character.toUpperCase(p.charAt(0)));
                    if (p.length() > 1) sb.append(p.substring(1));
                    sb.append(" ");
                }
            }
            String capitalized = sb.toString().trim();
            if (capitalized.isEmpty()) capitalized = "Student";

            User newStudent = User.builder()
                    .email(email)
                    .fullName(capitalized + " (Student)")
                    .role(Role.ROLE_STUDENT)
                    .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .lastLoginAt(LocalDateTime.now())
                    .build();
            User saved = userRepository.save(newStudent);
            auditLogService.log(email, "ROLE_STUDENT", "AUTO_REGISTER_STUDENT_OTP", "User", saved.getId(), "Student auto-registered via verified Email OTP", ip);
            return saved;
        });

        if (!user.isActive()) {
            throw new BadCredentialsException("Account is inactive or locked. Please contact administrator.");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
        auditLogService.log(email, user.getRole().name(), "LOGIN_OTP_SUCCESS", "User", user.getId(), "OTP login successful", ip);

        String token = tokenProvider.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .user(toDto(user))
                .message("Login via OTP successful!")
                .build();
    

    }
    @Transactional
    public void resetPassword(ResetPasswordRequest request, String ip) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No account found with email: " + email));

        boolean verified = otpService.verifyOtp(email, request.getOtpCode(), "FORGOT_PASSWORD");
        if (!verified) {
            throw new IllegalArgumentException("Invalid or expired OTP code for password reset.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        auditLogService.log(email, user.getRole().name(), "PASSWORD_RESET_SUCCESS", "User", user.getId(), "Password reset via OTP", ip);
    }

    @Transactional
    public void changePassword(String userEmail, ChangePasswordRequest request, String ip) {
        User user = userRepository.findByEmail(userEmail.toLowerCase().trim())
                .or(() -> userRepository.findByStaffId(userEmail.trim()))
                .orElseThrow(() -> new IllegalArgumentException("User account not found: " + userEmail));

        // If current password is provided, verify it
        if (request.getCurrentPassword() != null && !request.getCurrentPassword().isBlank()) {
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new IllegalArgumentException("Current password does not match our records.");
            }
        }

        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters long.");
        }

        if (request.getConfirmPassword() != null && !request.getConfirmPassword().isBlank()) {
            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                throw new IllegalArgumentException("New password and confirmation do not match.");
            }
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        auditLogService.log(user.getEmail(), user.getRole().name(), "PASSWORD_CHANGED_BY_USER", "User", user.getId(),
                "User changed their password from dashboard", ip);
    }

    @Transactional
    public AuthResponse updateBossCredentials(String userEmail, UpdateBossCredentialsRequest req, String ip) {
        User user = userRepository.findByEmail(userEmail.toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("Boss Admin account not found for: " + userEmail));

        if (user.getRole() != Role.ROLE_BOSS_ADMIN) {
            throw new SecurityException("Access Denied: Only Super Boss Admin can update Boss login credentials.");
        }

        String oldEmail = user.getEmail();

        // 1. Email update
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            String newEmail = req.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(oldEmail)) {
                if (userRepository.existsByEmail(newEmail)) {
                    throw new IllegalArgumentException("The email address '" + newEmail + "' is already registered to another account.");
                }
                user.setEmail(newEmail);
            }
        }

        // 2. Full Name update
        if (req.getFullName() != null && !req.getFullName().isBlank()) {
            user.setFullName(req.getFullName().trim());
        }

        // 3. Phone update
        if (req.getPhone() != null) {
            user.setPhone(req.getPhone().trim());
        }

        // 4. Password update
        if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
            if (req.getCurrentPassword() != null && !req.getCurrentPassword().isBlank()) {
                if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
                    throw new IllegalArgumentException("Current password does not match our records.");
                }
            }
            if (req.getNewPassword().length() < 6) {
                throw new IllegalArgumentException("New password must be at least 6 characters long.");
            }
            if (req.getConfirmPassword() != null && !req.getConfirmPassword().isBlank()) {
                if (!req.getNewPassword().equals(req.getConfirmPassword())) {
                    throw new IllegalArgumentException("New password and confirmation do not match.");
                }
            }
            user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        }

        userRepository.save(user);

        auditLogService.log(user.getEmail(), "ROLE_BOSS_ADMIN", "BOSS_CREDENTIALS_UPDATED", "User", user.getId(),
                "Boss Admin updated login credentials. Login Email: " + user.getEmail() + " (Previous: " + oldEmail + ")", ip);

        String newToken = tokenProvider.generateToken(user);
        return AuthResponse.builder()
                .token(newToken)
                .user(toDto(user))
                .message("Boss Admin credentials updated successfully! New login email: " + user.getEmail())
                .build();
    }
    @Transactional
    public UserDto createSuperAdmin(CreateUserRequest request, String createdByEmail, String ip) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("User with email " + email + " already exists.");
        }

        String inst = request.getInstitutionName() != null ? request.getInstitutionName().trim() : null;
        // One institution can be provided with multiple Super Admins as per requirements by Boss Admin

        String rawPassword = request.getPassword() != null && !request.getPassword().isBlank() 
                ? request.getPassword() : "SuperAdmin@2026";

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(Role.ROLE_SUPER_ADMIN)
                .institutionName(inst)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);
        auditLogService.log(createdByEmail, "ROLE_BOSS_ADMIN", "SUPER_ADMIN_CREATED", "User", user.getId(), 
                "Boss Admin created Super Admin: " + user.getFullName() + " for Institute: " + inst, ip);
        return toDto(user);
    

    }
    @Transactional
    public UserDto createTrainer(CreateUserRequest request, String createdByEmail, String createdByRole, String ip) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("User with email " + email + " already exists.");
        }

        String instName = request.getInstitutionName();
        // Super Admin creates trainer under their own institution
        User creator = userRepository.findByEmail(createdByEmail).orElse(null);
        if (creator != null && creator.getRole() == Role.ROLE_SUPER_ADMIN && creator.getInstitutionName() != null) {
            instName = creator.getInstitutionName();
        }

        Long superAdminId = (creator != null && creator.getRole() == Role.ROLE_SUPER_ADMIN) ? creator.getId() : request.getSuperAdminId();
        String superAdminName = (creator != null && creator.getRole() == Role.ROLE_SUPER_ADMIN) ? creator.getFullName() : request.getSuperAdminName();

        String rawPassword = request.getPassword() != null && !request.getPassword().isBlank() 
                ? request.getPassword() : "Trainer@2026";

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(Role.ROLE_TRAINER)
                .institutionName(instName)
                .assignedSubject(request.getAssignedSubject())
                .superAdminId(superAdminId)
                .superAdminName(superAdminName)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);
        auditLogService.log(createdByEmail, createdByRole, "TRAINER_CREATED", "User", user.getId(), 
                "Provisioned Trainer: " + user.getFullName() + " for Subject: " + request.getAssignedSubject(), ip);
        return toDto(user);
    

    }
    @Transactional
    public AuthResponse loginAsDemoRole(String roleStr, String ip) {
        String normalized = roleStr.toUpperCase().trim();
        if (!normalized.startsWith("ROLE_")) {
            normalized = "ROLE_" + normalized;
        }
        Role targetRole = Role.valueOf(normalized);
        User user = userRepository.findByRole(targetRole).stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No seed account found in database for role: " + targetRole));

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
        auditLogService.log(user.getEmail(), user.getRole().name(), "DEMO_SWITCH_LOGIN", "User", user.getId(),
                "Authenticated demo session as " + user.getRole().name(), ip);

        String token = tokenProvider.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .user(toDto(user))
                .message("Switched to demo role: " + user.getRole().name())
                .build();
    }

    public List<UserDto> getUsersByRole(Role role) {
        return userRepository.findByRole(role).stream().map(this::toDto).toList();
    }

    public List<UserDto> getUsersByRoleAndInstitution(Role role, String institutionName) {
        if (institutionName == null || institutionName.isBlank() || "ALL".equalsIgnoreCase(institutionName)) {
            return getUsersByRole(role);
        }
        return userRepository.findByRoleAndInstitutionName(role, institutionName).stream().map(this::toDto).toList();
    }

    public List<String> getDistinctInstitutions() {
        return userRepository.findDistinctInstitutions();
    

    }
    @Transactional
    public UserDto toggleUserStatus(Long userId, String performedByEmail, String ip) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        user.setActive(!user.isActive());
        userRepository.save(user);
        auditLogService.log(performedByEmail, "ROLE_BOSS_ADMIN", "USER_STATUS_TOGGLED", "User", user.getId(),
                "Super Admin " + user.getFullName() + " (" + user.getEmail() + ") active status toggled to: " + user.isActive(), ip);
        return toDto(user);
    

    }
    @Transactional
    public void deleteSuperAdmin(Long userId, String performedByEmail, String ip) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        if (user.getRole() != Role.ROLE_SUPER_ADMIN) {
            throw new IllegalArgumentException("Cannot delete user with role: " + user.getRole());
        }
        String name = user.getFullName();
        String inst = user.getInstitutionName();
        userRepository.delete(user);
        auditLogService.log(performedByEmail, "ROLE_BOSS_ADMIN", "SUPER_ADMIN_DELETED", "User", userId,
                "Boss Admin removed Super Admin: " + name + " from Institute: " + inst, ip);
    }

    public User findEntityByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .staffId(user.getStaffId())
                .role(user.getRole())
                .active(user.isActive())
                .avatarUrl(user.getAvatarUrl())
                .institutionId(user.getInstitutionId())
                .institutionName(user.getInstitutionName())
                .assignedSubject(user.getAssignedSubject())
                .superAdminId(user.getSuperAdminId())
                .superAdminName(user.getSuperAdminName())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }


    @Transactional
    public UserDto updateUser(Long userId, CreateUserRequest req, String actor, String ip) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        if (req.getFullName() != null && !req.getFullName().isBlank()) {
            user.setFullName(req.getFullName().trim());
        }
        if (req.getPhone() != null) {
            user.setPhone(req.getPhone().trim());
        }
        if (req.getAssignedSubject() != null) {
            user.setAssignedSubject(req.getAssignedSubject().trim());
        }
        userRepository.save(user);
        auditLogService.log(actor, "ADMIN", "USER_UPDATED", "User", user.getId(),
                "Updated user details for: " + user.getFullName() + " (" + user.getEmail() + ")", ip);
        return toDto(user);
    

    }
    @Transactional
    public void deleteTrainer(Long userId, String actor, String ip) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        if (user.getRole() != Role.ROLE_TRAINER) {
            throw new IllegalArgumentException("User is not a trainer");
        }
        String name = user.getFullName();
        userRepository.delete(user);
        auditLogService.log(actor, "ADMIN", "TRAINER_DELETED", "User", userId,
                "Trainer deleted: " + name, ip);
    

    }
    @Transactional
    public void deleteStudent(Long userId, String actor, String ip) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        if (user.getRole() != Role.ROLE_STUDENT) {
            throw new IllegalArgumentException("User is not a student");
        }
        String name = user.getFullName();
        userRepository.delete(user);
        auditLogService.log(actor, "ADMIN", "STUDENT_DELETED", "User", userId,
                "Student removed: " + name, ip);
    }
}
