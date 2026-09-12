package com.bridgeai.portal.controller;

import com.bridgeai.portal.dto.AuthDtos.*;
import com.bridgeai.portal.model.AuditLog;
import com.bridgeai.portal.model.VigilanceRecord;
import com.bridgeai.portal.service.VigilanceService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class VigilanceController {

    private final VigilanceService vigilanceService;

    // =========================================================================
    // BOSS ADMIN VIGILANCE MANAGEMENT ENDPOINTS
    // =========================================================================

    @GetMapping("/boss/vigilance/officers")
    @PreAuthorize("hasAuthority('ROLE_BOSS_ADMIN')")
    public ResponseEntity<List<UserDto>> getVigilanceOfficers() {
        return ResponseEntity.ok(vigilanceService.getAllVigilanceOfficers());
    }

    @PostMapping("/boss/vigilance/officers")
    @PreAuthorize("hasAuthority('ROLE_BOSS_ADMIN')")
    public ResponseEntity<UserDto> appointVigilanceOfficer(
            @Valid @RequestBody AppointVigilanceOfficerRequest request,
            Authentication auth,
            HttpServletRequest req) {
        String bossEmail = auth != null ? auth.getName() : "boss@bridgeai.edu";
        String ip = req.getRemoteAddr();
        return ResponseEntity.ok(vigilanceService.appointVigilanceOfficer(request, bossEmail, ip));
    }

    @PutMapping("/boss/vigilance/officers/{id}/status")
    @PreAuthorize("hasAuthority('ROLE_BOSS_ADMIN')")
    public ResponseEntity<UserDto> toggleOfficerStatus(
            @PathVariable Long id,
            Authentication auth,
            HttpServletRequest req) {
        String bossEmail = auth != null ? auth.getName() : "boss@bridgeai.edu";
        String ip = req.getRemoteAddr();
        return ResponseEntity.ok(vigilanceService.toggleOfficerStatus(id, bossEmail, ip));
    }

    @PutMapping("/boss/vigilance/officers/{id}/reset-password")
    @PreAuthorize("hasAuthority('ROLE_BOSS_ADMIN')")
    public ResponseEntity<UserDto> resetOfficerPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetOfficerPasswordRequest request,
            Authentication auth,
            HttpServletRequest req) {
        String bossEmail = auth != null ? auth.getName() : "boss@bridgeai.edu";
        String ip = req.getRemoteAddr();
        return ResponseEntity.ok(vigilanceService.resetOfficerPassword(id, request, bossEmail, ip));
    }

    @GetMapping("/boss/vigilance/activity")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_VIGILANCE_OFFICER')")
    public ResponseEntity<List<AuditLog>> getOfficerActivities() {
        return ResponseEntity.ok(vigilanceService.getOfficerActivities());
    }

    @GetMapping("/boss/vigilance/reports")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_VIGILANCE_OFFICER')")
    public ResponseEntity<List<VigilanceRecord>> getVigilanceReports() {
        return ResponseEntity.ok(vigilanceService.getAllVigilanceReports());
    }

    @GetMapping("/boss/vigilance/warnings")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_VIGILANCE_OFFICER')")
    public ResponseEntity<List<VigilanceRecord>> getWarningsIssued() {
        return ResponseEntity.ok(vigilanceService.getWarningsIssued());
    }

    @GetMapping("/boss/vigilance/terminations")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_VIGILANCE_OFFICER')")
    public ResponseEntity<List<Map<String, Object>>> getStudentTerminations() {
        return ResponseEntity.ok(vigilanceService.getStudentTerminations());
    }

    // =========================================================================
    // VIGILANCE OFFICER WORKSPACE ENDPOINTS
    // =========================================================================

    @PostMapping("/vigilance/action")
    @PreAuthorize("hasAnyAuthority('ROLE_VIGILANCE_OFFICER', 'ROLE_BOSS_ADMIN')")
    public ResponseEntity<VigilanceRecord> recordVigilanceAction(
            @Valid @RequestBody VigilanceActionRequest request,
            Authentication auth,
            HttpServletRequest req) {
        String officerEmail = auth != null ? auth.getName() : "vigilance@bridgeai.edu";
        String ip = req.getRemoteAddr();
        return ResponseEntity.ok(vigilanceService.recordVigilanceAction(request, officerEmail, ip));
    }

    @GetMapping("/vigilance/live-attempts")
    @PreAuthorize("hasAnyAuthority('ROLE_VIGILANCE_OFFICER', 'ROLE_BOSS_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getLiveExamMonitoringFeed() {
        return ResponseEntity.ok(vigilanceService.getLiveExamMonitoringFeed());
    }

    @GetMapping("/vigilance/surveillance-tree")
    @PreAuthorize("hasAnyAuthority('ROLE_VIGILANCE_OFFICER', 'ROLE_BOSS_ADMIN')")
    public ResponseEntity<Map<String, Object>> getSurveillanceTree() {
        return ResponseEntity.ok(vigilanceService.getSurveillanceTree());
    }

    @PostMapping("/vigilance/evidence/capture")
    @PreAuthorize("hasAnyAuthority('ROLE_VIGILANCE_OFFICER', 'ROLE_BOSS_ADMIN')")
    public ResponseEntity<VigilanceRecord> captureEvidence(
            @Valid @RequestBody EvidenceCaptureRequest request,
            Authentication auth,
            HttpServletRequest req) {
        String officerEmail = auth != null ? auth.getName() : "vigilance@bridgeai.edu";
        String ip = req.getRemoteAddr();
        return ResponseEntity.ok(vigilanceService.captureEvidence(request, officerEmail, ip));
    }

    @GetMapping("/vigilance/evidence")
    @PreAuthorize("hasAnyAuthority('ROLE_VIGILANCE_OFFICER', 'ROLE_BOSS_ADMIN')")
    public ResponseEntity<List<VigilanceRecord>> getAllEvidence() {
        return ResponseEntity.ok(vigilanceService.getAllEvidence());
    }

    @PostMapping("/vigilance/chat/send")
    @PreAuthorize("hasAnyAuthority('ROLE_VIGILANCE_OFFICER', 'ROLE_BOSS_ADMIN', 'ROLE_STUDENT')")
    public ResponseEntity<VigilanceRecord> sendExamChat(
            @Valid @RequestBody SendChatRequest request,
            Authentication auth,
            HttpServletRequest req) {
        String officerEmail = auth != null ? auth.getName() : "vigilance@bridgeai.edu";
        String ip = req.getRemoteAddr();
        return ResponseEntity.ok(vigilanceService.sendExamChat(request, officerEmail, ip));
    }

    @GetMapping("/vigilance/chat/{attemptId}")
    @PreAuthorize("hasAnyAuthority('ROLE_VIGILANCE_OFFICER', 'ROLE_BOSS_ADMIN', 'ROLE_STUDENT')")
    public ResponseEntity<List<VigilanceRecord>> getExamChat(@PathVariable Long attemptId) {
        return ResponseEntity.ok(vigilanceService.getExamChat(attemptId));
    }

    @GetMapping("/vigilance/student-interventions/{attemptId}")
    @PreAuthorize("hasAnyAuthority('ROLE_STUDENT', 'ROLE_VIGILANCE_OFFICER', 'ROLE_BOSS_ADMIN')")
    public ResponseEntity<Map<String, Object>> getStudentInterventions(@PathVariable Long attemptId) {
        return ResponseEntity.ok(vigilanceService.getStudentInterventions(attemptId));
    }

    @PostMapping("/vigilance/warning/{id}/acknowledge")
    @PreAuthorize("hasAnyAuthority('ROLE_STUDENT', 'ROLE_VIGILANCE_OFFICER', 'ROLE_BOSS_ADMIN')")
    public ResponseEntity<Map<String, String>> acknowledgeWarning(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "1") Long studentId) {
        vigilanceService.acknowledgeWarning(id, studentId);
        return ResponseEntity.ok(Map.of("message", "Warning acknowledged successfully."));
    }

    @PostMapping("/vigilance/feed/stream/{attemptId}")
    @PreAuthorize("hasAnyAuthority('ROLE_STUDENT', 'ROLE_VIGILANCE_OFFICER', 'ROLE_BOSS_ADMIN')")
    public ResponseEntity<Map<String, Object>> pushLiveStream(
            @PathVariable Long attemptId,
            @RequestBody Map<String, Object> payload) {
        String cameraFrame = (String) payload.get("cameraFrame");
        String screenFrame = (String) payload.get("screenFrame");
        boolean camOn = Boolean.TRUE.equals(payload.get("cameraConnected"));
        boolean scrOn = Boolean.TRUE.equals(payload.get("screenConnected"));
        vigilanceService.saveLiveStreamFrame(attemptId, cameraFrame, screenFrame, camOn, scrOn);
        return ResponseEntity.ok(Map.of("status", "STREAM_INGESTED", "attemptId", attemptId));
    }

    @GetMapping("/vigilance/feed/stream/{attemptId}")
    @PreAuthorize("hasAnyAuthority('ROLE_VIGILANCE_OFFICER', 'ROLE_BOSS_ADMIN', 'ROLE_STUDENT')")
    public ResponseEntity<VigilanceService.LiveStreamFrame> getLiveStream(@PathVariable Long attemptId) {
        VigilanceService.LiveStreamFrame frame = vigilanceService.getLiveStreamFrame(attemptId);
        if (frame == null) {
            return ResponseEntity.ok(new VigilanceService.LiveStreamFrame(attemptId, null, null, false, false, 0));
        }
        return ResponseEntity.ok(frame);
    }
}
