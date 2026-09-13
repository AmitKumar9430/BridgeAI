package com.bridgeai.portal.controller;

import com.bridgeai.portal.model.AuditLog;
import com.bridgeai.portal.repository.*;
import com.bridgeai.portal.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogService auditLogService;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final ExamRepository examRepository;
    private final ExamAttemptRepository attemptRepository;
    private final AssignmentSubmissionRepository submissionRepository;

    @GetMapping("/logs")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<AuditLog>> getLogs(org.springframework.security.core.Authentication auth) {
        com.bridgeai.portal.model.User user = null;
        if (auth != null && auth.getName() != null) {
            user = userRepository.findByEmail(auth.getName()).orElse(null);
        }
        return ResponseEntity.ok(auditLogService.getRecentLogs(user));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<Map<String, Object>> getStats(org.springframework.security.core.Authentication auth) {
        com.bridgeai.portal.model.User user = null;
        if (auth != null && auth.getName() != null) {
            user = userRepository.findByEmail(auth.getName()).orElse(null);
        }

        Map<String, Object> stats = new HashMap<>();
        if (user == null || user.getRole() == com.bridgeai.portal.model.Role.ROLE_BOSS_ADMIN) {
            stats.put("totalUsers", userRepository.count());
            stats.put("totalCourses", courseRepository.count());
            stats.put("totalExams", examRepository.count());
            stats.put("totalAttempts", attemptRepository.count());
            stats.put("totalSubmissions", submissionRepository.count());
        } else if (user.getInstitutionId() != null) {
            Long instId = user.getInstitutionId();
            stats.put("totalUsers", userRepository.countByInstitutionId(instId));
            stats.put("totalCourses", courseRepository.countByInstitutionId(instId));
            stats.put("totalExams", examRepository.countByInstitutionId(instId));
            stats.put("totalAttempts", attemptRepository.countByInstitutionId(instId));
            stats.put("totalSubmissions", submissionRepository.countByInstitutionId(instId));
        } else if (user.getInstitutionName() != null && !user.getInstitutionName().isBlank()) {
            String instName = user.getInstitutionName();
            stats.put("totalUsers", userRepository.countByInstitutionName(instName));
            stats.put("totalCourses", courseRepository.countByInstitutionName(instName));
            stats.put("totalExams", examRepository.countByInstitutionNameIgnoreCase(instName));
            stats.put("totalAttempts", attemptRepository.countByInstitutionName(instName));
            stats.put("totalSubmissions", submissionRepository.countByInstitutionName(instName));
        } else {
            stats.put("totalUsers", userRepository.count());
            stats.put("totalCourses", courseRepository.count());
            stats.put("totalExams", examRepository.count());
            stats.put("totalAttempts", attemptRepository.count());
            stats.put("totalSubmissions", submissionRepository.count());
        }
        return ResponseEntity.ok(stats);
    }
}
