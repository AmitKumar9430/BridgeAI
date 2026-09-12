package com.bridgeai.portal.controller;

import com.bridgeai.portal.dto.AuthDtos.CreateUserRequest;
import com.bridgeai.portal.dto.AuthDtos.UserDto;
import com.bridgeai.portal.model.Role;
import com.bridgeai.portal.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/admin", "/admin"})
@RequiredArgsConstructor
public class AdminController {

    private final AuthService authService;

    // Boss Admin creates Super Admins
    @PostMapping("/super-admins")
    @PreAuthorize("hasAuthority('ROLE_BOSS_ADMIN')")
    public ResponseEntity<UserDto> createSuperAdmin(
            @Valid @RequestBody CreateUserRequest request,
            Authentication auth,
            HttpServletRequest req) {
        String actor = auth != null ? auth.getName() : "boss@bridgeai.edu";
        String ip = req.getRemoteAddr();
        return ResponseEntity.ok(authService.createSuperAdmin(request, actor, ip));
    }

    // List all Super Admins (optionally filtered by institution, accessible to Boss Admin & Super Admin)
    @GetMapping("/super-admins")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<UserDto>> getSuperAdmins(
            @RequestParam(required = false) String institutionName,
            Authentication auth) {
        String targetInst = institutionName;
        if (targetInst == null && auth != null) {
            var user = authService.findEntityByEmail(auth.getName());
            if (user != null && user.getRole() == Role.ROLE_SUPER_ADMIN) {
                targetInst = user.getInstitutionName();
            }
        }
        if (targetInst != null && !targetInst.isBlank() && !"ALL".equalsIgnoreCase(targetInst)) {
            return ResponseEntity.ok(authService.getUsersByRoleAndInstitution(Role.ROLE_SUPER_ADMIN, targetInst));
        }
        return ResponseEntity.ok(authService.getUsersByRole(Role.ROLE_SUPER_ADMIN));
    }

    // Toggle Super Admin active status (Boss Admin privilege)
    @PutMapping("/super-admins/{id}/toggle-status")
    @PreAuthorize("hasAuthority('ROLE_BOSS_ADMIN')")
    public ResponseEntity<UserDto> toggleSuperAdminStatus(
            @PathVariable Long id,
            Authentication auth,
            HttpServletRequest req) {
        String actor = auth != null ? auth.getName() : "boss@bridgeai.edu";
        String ip = req.getRemoteAddr();
        return ResponseEntity.ok(authService.toggleUserStatus(id, actor, ip));
    }

    // Delete Super Admin (Boss Admin privilege)
    @DeleteMapping("/super-admins/{id}")
    @PreAuthorize("hasAuthority('ROLE_BOSS_ADMIN')")
    public ResponseEntity<Void> deleteSuperAdmin(
            @PathVariable Long id,
            Authentication auth,
            HttpServletRequest req) {
        String actor = auth != null ? auth.getName() : "boss@bridgeai.edu";
        String ip = req.getRemoteAddr();
        authService.deleteSuperAdmin(id, actor, ip);
        return ResponseEntity.noContent().build();
    }

    // Super Admin (or Boss Admin) creates Trainers
    @PostMapping("/trainers")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<UserDto> createTrainer(
            @Valid @RequestBody CreateUserRequest request,
            Authentication auth,
            HttpServletRequest req) {
        String actor = auth != null ? auth.getName() : "superadmin@bridgeai.edu";
        String role = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_BOSS_ADMIN")) 
                ? "ROLE_BOSS_ADMIN" : "ROLE_SUPER_ADMIN";
        String ip = req.getRemoteAddr();
        return ResponseEntity.ok(authService.createTrainer(request, actor, role, ip));
    }

    // List all registered Institutions
    @GetMapping("/institutions")
    public ResponseEntity<List<String>> getInstitutions() {
        return ResponseEntity.ok(authService.getDistinctInstitutions());
    }

    // List Trainers (filtered by institution if specified or scoped to Super Admin)
    @GetMapping("/trainers")
    public ResponseEntity<List<UserDto>> getTrainers(
            @RequestParam(required = false) String institutionName,
            Authentication auth) {
        String targetInst = institutionName;
        if (targetInst == null && auth != null) {
            var user = authService.findEntityByEmail(auth.getName());
            if (user != null && user.getRole() == Role.ROLE_SUPER_ADMIN) {
                targetInst = user.getInstitutionName();
            }
        }
        return ResponseEntity.ok(authService.getUsersByRoleAndInstitution(Role.ROLE_TRAINER, targetInst));
    }

    // List Students (filtered by institution if specified or scoped to Super Admin/Trainer)
    @GetMapping("/students")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<List<UserDto>> getStudents(
            @RequestParam(required = false) String institutionName,
            Authentication auth) {
        String targetInst = institutionName;
        if (targetInst == null && auth != null) {
            var user = authService.findEntityByEmail(auth.getName());
            if (user != null && (user.getRole() == Role.ROLE_SUPER_ADMIN || user.getRole() == Role.ROLE_TRAINER)) {
                targetInst = user.getInstitutionName();
            }
        }
        return ResponseEntity.ok(authService.getUsersByRoleAndInstitution(Role.ROLE_STUDENT, targetInst));
    }

    @PutMapping("/trainers/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<UserDto> updateTrainer(
            @PathVariable Long id,
            @RequestBody CreateUserRequest req,
            Authentication auth,
            HttpServletRequest request) {
        String actor = auth != null ? auth.getName() : "admin@bridgeai.edu";
        String ip = request.getRemoteAddr();
        return ResponseEntity.ok(authService.updateUser(id, req, actor, ip));
    }

    @DeleteMapping("/trainers/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> deleteTrainer(
            @PathVariable Long id,
            Authentication auth,
            HttpServletRequest request) {
        String actor = auth != null ? auth.getName() : "admin@bridgeai.edu";
        String ip = request.getRemoteAddr();
        authService.deleteTrainer(id, actor, ip);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/students/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<UserDto> updateStudent(
            @PathVariable Long id,
            @RequestBody CreateUserRequest req,
            Authentication auth,
            HttpServletRequest request) {
        String actor = auth != null ? auth.getName() : "admin@bridgeai.edu";
        String ip = request.getRemoteAddr();
        return ResponseEntity.ok(authService.updateUser(id, req, actor, ip));
    }

    @DeleteMapping("/students/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> deleteStudent(
            @PathVariable Long id,
            Authentication auth,
            HttpServletRequest request) {
        String actor = auth != null ? auth.getName() : "admin@bridgeai.edu";
        String ip = request.getRemoteAddr();
        authService.deleteStudent(id, actor, ip);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/super-admins/{id}")
    @PreAuthorize("hasAuthority('ROLE_BOSS_ADMIN')")
    public ResponseEntity<UserDto> updateSuperAdmin(
            @PathVariable Long id,
            @RequestBody CreateUserRequest req,
            Authentication auth,
            HttpServletRequest request) {
        String actor = auth != null ? auth.getName() : "boss@bridgeai.edu";
        String ip = request.getRemoteAddr();
        return ResponseEntity.ok(authService.updateUser(id, req, actor, ip));
    }
}
