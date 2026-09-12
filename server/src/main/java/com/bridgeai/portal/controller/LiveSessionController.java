package com.bridgeai.portal.controller;

import com.bridgeai.portal.model.LiveSession;
import com.bridgeai.portal.model.User;
import com.bridgeai.portal.repository.UserRepository;
import com.bridgeai.portal.service.LiveSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class LiveSessionController {

    private final LiveSessionService liveSessionService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<LiveSession>> getAllSessions(
            @RequestParam(required = false) Long institutionId,
            @RequestParam(required = false) Long trainerId,
            @RequestParam(required = false) String role,
            @RequestParam(required = false, defaultValue = "false") boolean upcomingOnly) {
        if (institutionId != null && role == null) {
            return ResponseEntity.ok(liveSessionService.getSessionsByInstitution(institutionId));
        }
        if (trainerId != null) {
            return ResponseEntity.ok(liveSessionService.getSessionsByTrainer(trainerId));
        }
        if (upcomingOnly) {
            return ResponseEntity.ok(liveSessionService.getAllUpcomingSessions());
        }
        if (role != null && !role.isBlank()) {
            return ResponseEntity.ok(liveSessionService.getSessionsForRole(role, institutionId));
        }
        return ResponseEntity.ok(liveSessionService.getAllSessions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LiveSession> getSessionById(@PathVariable Long id) {
        return ResponseEntity.ok(liveSessionService.getSessionById(id));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<LiveSession>> getCourseSessions(@PathVariable Long courseId) {
        return ResponseEntity.ok(liveSessionService.getSessionsByCourse(courseId));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<LiveSession> scheduleSession(@RequestBody LiveSession session, Authentication auth) {
        if (auth != null) {
            User user = userRepository.findByEmail(auth.getName()).orElse(null);
            if (user != null) {
                if (session.getCreatorRole() == null || session.getCreatorRole().isBlank()) {
                    session.setCreatorRole(user.getRole() != null ? user.getRole().name() : "ROLE_TRAINER");
                }
                if (session.getTargetAudience() == null || session.getTargetAudience().isBlank()) {
                    if (user.getRole() != null && "ROLE_BOSS_ADMIN".equals(user.getRole().name())) {
                        session.setTargetAudience("Super Admins, Trainers & Students");
                    } else if (user.getRole() != null && "ROLE_SUPER_ADMIN".equals(user.getRole().name())) {
                        session.setTargetAudience("Trainers & Students");
                    } else {
                        session.setTargetAudience("Enrolled Students");
                    }
                }
                if (session.getTrainerName() == null || session.getTrainerName().isBlank()) {
                    session.setTrainerName(user.getFullName());
                }
                if (session.getTrainerId() == null) {
                    session.setTrainerId(user.getId());
                }
                if (session.getTrainerEmail() == null || session.getTrainerEmail().isBlank()) {
                    session.setTrainerEmail(user.getEmail());
                }
                if (session.getInstitutionName() == null || session.getInstitutionName().isBlank()) {
                    session.setInstitutionName(user.getInstitutionName());
                }
                if (session.getInstitutionId() == null && user.getInstitutionId() != null) {
                    session.setInstitutionId(user.getInstitutionId());
                }
            }
        }
        return ResponseEntity.ok(liveSessionService.scheduleSession(session));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<LiveSession> updateSession(@PathVariable Long id, @RequestBody LiveSession session, Authentication auth) {
        verifySessionCreator(id, auth);
        return ResponseEntity.ok(liveSessionService.updateSession(id, session));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id, Authentication auth) {
        verifySessionCreator(id, auth);
        liveSessionService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<LiveSession> updateStatus(@PathVariable Long id, @RequestParam String status, Authentication auth) {
        verifySessionCreator(id, auth);
        return ResponseEntity.ok(liveSessionService.updateStatus(id, status));
    }

    @PutMapping("/{id}/recording")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<LiveSession> updateRecording(
            @PathVariable Long id,
            @RequestParam String recordingVideoUrl,
            @RequestParam(required = false) String recordingNotes,
            Authentication auth) {
        verifySessionCreator(id, auth);
        return ResponseEntity.ok(liveSessionService.updateRecording(id, recordingVideoUrl, recordingNotes));
    }

    private void verifySessionCreator(Long sessionId, Authentication auth) {
        if (auth == null) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication required.");
        }
        User currentUser = userRepository.findByEmail(auth.getName()).orElse(null);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("User not found.");
        }
        LiveSession existing = liveSessionService.getSessionById(sessionId);
        boolean isCreator = false;
        if (existing.getTrainerId() != null && existing.getTrainerId().equals(currentUser.getId())) {
            isCreator = true;
        } else if (existing.getTrainerEmail() != null && existing.getTrainerEmail().equalsIgnoreCase(currentUser.getEmail())) {
            isCreator = true;
        } else if (existing.getTrainerName() != null && currentUser.getFullName() != null) {
            String existingName = existing.getTrainerName().trim().toLowerCase();
            String currentName = currentUser.getFullName().trim().toLowerCase();
            if (existingName.equals(currentName) || existingName.contains(currentName) || currentName.contains(existingName)) {
                isCreator = true;
            }
        } else if (currentUser.getRole() != null && "ROLE_BOSS_ADMIN".equals(currentUser.getRole().name())
                && "ROLE_BOSS_ADMIN".equals(existing.getCreatorRole())) {
            isCreator = true;
        }
        if (!isCreator) {
            throw new org.springframework.security.access.AccessDeniedException("Only the person who created this live session can edit or delete it.");
        }
    }
}
