package com.bridgeai.portal.controller;

import com.bridgeai.portal.dto.AuthDtos.*;
import com.bridgeai.portal.model.User;
import com.bridgeai.portal.repository.UserRepository;
import com.bridgeai.portal.service.AuthService;
import com.bridgeai.portal.service.OtpService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/auth", "/auth"})
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;
    private final UserRepository userRepository;

    @PostMapping("/send-otp")
    public ResponseEntity<OtpDispatchPayload> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        OtpDispatchPayload payload = otpService.generateAndDispatchOtp(
                request.getEmail(),
                request.getFullName(),
                request.getPurpose()
        );
        return ResponseEntity.ok(payload);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        boolean valid = otpService.verifyOtp(request.getEmail(), request.getOtpCode(), request.getPurpose());
        if (valid) {
            return ResponseEntity.ok().body("{\"verified\": true, \"message\": \"OTP verified successfully\"}");
        } else {
            return ResponseEntity.badRequest().body("{\"verified\": false, \"message\": \"Invalid or expired OTP\"}");
        }
    }

    @GetMapping("/institutions")
    public ResponseEntity<?> getPublicInstitutions() {
        return ResponseEntity.ok(authService.getPublicInstitutions());
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerStudent(@Valid @RequestBody RegisterRequest request, HttpServletRequest req) {
        String ip = req.getRemoteAddr();
        AuthResponse response = authService.registerStudent(request, ip);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login/password-otp")
    public ResponseEntity<AuthResponse> loginPasswordOtp(@Valid @RequestBody LoginPasswordOtpRequest request, HttpServletRequest req) {
        String ip = req.getRemoteAddr();
        AuthResponse response = authService.loginWithPasswordAndOtp(request, ip);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login/otp-only")
    public ResponseEntity<AuthResponse> loginOtpOnly(@Valid @RequestBody LoginOtpOnlyRequest request, HttpServletRequest req) {
        String ip = req.getRemoteAddr();
        AuthResponse response = authService.loginWithOtpOnly(request, ip);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/demo-login")
    public ResponseEntity<AuthResponse> demoLogin(@Valid @RequestBody DemoLoginRequest request, HttpServletRequest req) {
        String ip = req.getRemoteAddr();
        return ResponseEntity.ok(authService.loginAsDemoRole(request.getRole(), ip));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request, HttpServletRequest req) {
        String ip = req.getRemoteAddr();
        authService.resetPassword(request, ip);
        return ResponseEntity.ok().body("{\"message\": \"Password reset successfully. You can now log in.\"}");
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication,
            HttpServletRequest req) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        String ip = req.getRemoteAddr();
        authService.changePassword(authentication.getName(), request, ip);
        return ResponseEntity.ok().body(Map.of(
                "success", true,
                "message", "Password changed successfully."
        ));
    }

    @PutMapping("/boss/credentials")
    @PreAuthorize("hasAuthority('ROLE_BOSS_ADMIN')")
    public ResponseEntity<AuthResponse> updateBossCredentials(
            @Valid @RequestBody UpdateBossCredentialsRequest request,
            Authentication authentication,
            HttpServletRequest req) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        String ip = req.getRemoteAddr();
        return ResponseEntity.ok(authService.updateBossCredentials(authentication.getName(), request, ip));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(authService.toDto(user));
    }
}
