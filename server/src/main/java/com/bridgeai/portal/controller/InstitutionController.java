package com.bridgeai.portal.controller;

import com.bridgeai.portal.dto.InstitutionDtos.*;
import com.bridgeai.portal.service.InstitutionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/institutions", "/institutions"})
@RequiredArgsConstructor
public class InstitutionController {

    private final InstitutionService institutionService;

    // Enroll a new Institution with full location and initial Super Admin (Boss Admin only)
    @PostMapping("/enroll")
    @PreAuthorize("hasAuthority('ROLE_BOSS_ADMIN')")
    public ResponseEntity<InstitutionDto> enrollInstitution(
            @Valid @RequestBody EnrollInstitutionRequest request,
            Authentication auth,
            HttpServletRequest req) {
        String actor = auth != null ? auth.getName() : "boss@bridgeai.edu";
        String ip = req.getRemoteAddr();
        return ResponseEntity.ok(institutionService.enrollInstitution(request, actor, ip));
    }

    // List all institutions with location details and metrics
    @GetMapping
    public ResponseEntity<List<InstitutionDto>> getAllInstitutions() {
        return ResponseEntity.ok(institutionService.getAllInstitutions());
    }

    // Get specific institution details by ID
    @GetMapping("/{id}")
    public ResponseEntity<InstitutionDto> getInstitutionById(@PathVariable Long id) {
        return ResponseEntity.ok(institutionService.getInstitutionById(id));
    }

    // Get multi-tier organizational tree: Institution -> Super Admins -> Trainers -> Subjects
    @GetMapping("/hierarchy")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<HierarchyInstitutionNode>> getHierarchyTree(Authentication auth) {
        return ResponseEntity.ok(institutionService.getHierarchyTree(auth));
    }

    // Get comprehensive profile of any user (Super Admin, Trainer, Student)
    @GetMapping("/users/{id}/profile")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<UserFullProfileDto> getUserFullProfile(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(institutionService.getUserFullProfile(id, auth));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_BOSS_ADMIN')")
    public ResponseEntity<InstitutionDto> updateInstitution(
            @PathVariable Long id,
            @RequestBody EnrollInstitutionRequest request,
            Authentication auth,
            HttpServletRequest req) {
        String actor = auth != null ? auth.getName() : "boss@bridgeai.edu";
        String ip = req.getRemoteAddr();
        return ResponseEntity.ok(institutionService.updateInstitution(id, request, actor, ip));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_BOSS_ADMIN')")
    public ResponseEntity<Void> deleteInstitution(
            @PathVariable Long id,
            Authentication auth,
            HttpServletRequest req) {
        String actor = auth != null ? auth.getName() : "boss@bridgeai.edu";
        String ip = req.getRemoteAddr();
        institutionService.deleteInstitution(id, actor, ip);
        return ResponseEntity.noContent().build();
    }
}
