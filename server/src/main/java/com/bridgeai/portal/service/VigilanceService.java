package com.bridgeai.portal.service;

import com.bridgeai.portal.dto.AuthDtos.*;
import com.bridgeai.portal.model.*;
import com.bridgeai.portal.repository.*;
import lombok.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class VigilanceService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final AuditLogRepository auditLogRepository;
    private final VigilanceRecordRepository vigilanceRecordRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final ExamViolationRepository examViolationRepository;
    private final ExamRepository examRepository;
    private final InstitutionRepository institutionRepository;
    private final AuthService authService;

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class LiveStreamFrame {
        private Long attemptId;
        private String cameraFrame;
        private String screenFrame;
        private boolean cameraConnected;
        private boolean screenConnected;
        private long timestamp;
    }

    private final Map<Long, LiveStreamFrame> liveStreamFrames = new java.util.concurrent.ConcurrentHashMap<>();

    public void saveLiveStreamFrame(Long attemptId, String cameraFrame, String screenFrame, boolean cameraConnected, boolean screenConnected) {
        if (attemptId == null) return;
        liveStreamFrames.put(attemptId, LiveStreamFrame.builder()
                .attemptId(attemptId)
                .cameraFrame(cameraFrame)
                .screenFrame(screenFrame)
                .cameraConnected(cameraConnected)
                .screenConnected(screenConnected)
                .timestamp(System.currentTimeMillis())
                .build());
    }

    public LiveStreamFrame getLiveStreamFrame(Long attemptId) {
        return liveStreamFrames.get(attemptId);
    }

    @Transactional
    public UserDto appointVigilanceOfficer(AppointVigilanceOfficerRequest req, String bossAdminEmail, String ip) {
        String email = req.getEmail().trim().toLowerCase();
        String staffId = req.getStaffId().trim().toUpperCase();

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("An account with email " + email + " already exists.");
        }
        if (userRepository.existsByStaffId(staffId)) {
            throw new IllegalArgumentException("A staff member with Staff ID " + staffId + " already exists.");
        }

        User officer = User.builder()
                .email(email)
                .fullName(req.getFullName().trim())
                .phone(req.getPhone() != null ? req.getPhone().trim() : null)
                .staffId(staffId)
                .password(passwordEncoder.encode(req.getPassword()))
                .role(Role.ROLE_VIGILANCE_OFFICER)
                .active(req.isActive())
                .institutionName("National Examination Board")
                .assignedSubject("Examination Vigilance & Anti-Fraud")
                .createdAt(LocalDateTime.now())
                .build();

        User saved = userRepository.save(officer);
        auditLogService.log(bossAdminEmail, "ROLE_BOSS_ADMIN", "VIGILANCE_OFFICER_APPOINTED", "User", saved.getId(),
                "Appointed Vigilance Officer: " + saved.getFullName() + " (Staff ID: " + saved.getStaffId() + ", Email: " + saved.getEmail() + ")", ip);

        log.info("Boss Admin {} appointed new Vigilance Officer {} ({})", bossAdminEmail, saved.getFullName(), saved.getStaffId());
        return authService.toDto(saved);
    }

    public List<UserDto> getAllVigilanceOfficers() {
        return userRepository.findByRole(Role.ROLE_VIGILANCE_OFFICER).stream()
                .map(authService::toDto)
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .toList();
    }

    @Transactional
    public UserDto toggleOfficerStatus(Long id, String bossAdminEmail, String ip) {
        User officer = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vigilance Officer not found with id: " + id));

        if (officer.getRole() != Role.ROLE_VIGILANCE_OFFICER) {
            throw new IllegalArgumentException("User is not a Vigilance Officer.");
        }

        officer.setActive(!officer.isActive());
        User saved = userRepository.save(officer);

        String action = saved.isActive() ? "VIGILANCE_OFFICER_ACTIVATED" : "VIGILANCE_OFFICER_DEACTIVATED";
        String statusLabel = saved.isActive() ? "Active" : "Deactivated";
        auditLogService.log(bossAdminEmail, "ROLE_BOSS_ADMIN", action, "User", saved.getId(),
                "Vigilance Officer " + saved.getFullName() + " (" + saved.getStaffId() + ") status changed to: " + statusLabel, ip);

        log.info("Boss Admin {} changed Vigilance Officer {} status to {}", bossAdminEmail, saved.getStaffId(), statusLabel);
        return authService.toDto(saved);
    }

    @Transactional
    public UserDto resetOfficerPassword(Long id, ResetOfficerPasswordRequest req, String bossAdminEmail, String ip) {
        User officer = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vigilance Officer not found with id: " + id));

        if (officer.getRole() != Role.ROLE_VIGILANCE_OFFICER) {
            throw new IllegalArgumentException("User is not a Vigilance Officer.");
        }

        officer.setPassword(passwordEncoder.encode(req.getNewPassword()));
        User saved = userRepository.save(officer);

        auditLogService.log(bossAdminEmail, "ROLE_BOSS_ADMIN", "VIGILANCE_OFFICER_PASSWORD_RESET", "User", saved.getId(),
                "Password reset by Boss Admin for Vigilance Officer " + saved.getFullName() + " (" + saved.getStaffId() + ")", ip);

        log.info("Boss Admin {} reset password for Vigilance Officer {}", bossAdminEmail, saved.getStaffId());
        return authService.toDto(saved);
    }

    @Transactional
    public VigilanceRecord recordVigilanceAction(VigilanceActionRequest req, String officerEmail, String ip) {
        User officer = userRepository.findByEmail(officerEmail)
                .orElse(null);

        Long officerId = officer != null ? officer.getId() : 0L;
        String officerName = officer != null ? officer.getFullName() : "Vigilance Officer";
        String officerStaffId = officer != null && officer.getStaffId() != null ? officer.getStaffId() : "VO-SEC";

        // If action is termination, terminate the exam attempt immediately
        if ("TERMINATE_EXAM".equalsIgnoreCase(req.getActionType()) && req.getAttemptId() != null) {
            examAttemptRepository.findById(req.getAttemptId()).ifPresent(attempt -> {
                attempt.setStatus("TERMINATED_BY_VIOLATION");
                attempt.setCompletedAt(LocalDateTime.now());
                attempt.setCanReattempt(false);
                examAttemptRepository.save(attempt);
                log.warn("Vigilance Officer {} terminated exam attempt id {}", officerStaffId, attempt.getId());
            });
        }

        VigilanceRecord record = VigilanceRecord.builder()
                .officerId(officerId)
                .officerName(officerName)
                .officerStaffId(officerStaffId)
                .studentId(req.getStudentId() != null ? req.getStudentId() : 0L)
                .studentName(req.getStudentName() != null ? req.getStudentName() : "Student")
                .studentEmail(req.getStudentEmail())
                .examId(req.getExamId())
                .examTitle(req.getExamTitle() != null ? req.getExamTitle() : "Proctored Examination")
                .attemptId(req.getAttemptId())
                .actionType(req.getActionType().toUpperCase())
                .severity(req.getSeverity() != null ? req.getSeverity().toUpperCase() : "HIGH")
                .reason(req.getReason())
                .officerNotes(req.getOfficerNotes())
                .evidenceId(req.getEvidenceId())
                .evidenceSnapshot(req.getEvidenceSnapshot())
                .chatMessage(req.getChatMessage())
                .timestamp(LocalDateTime.now())
                .build();

        VigilanceRecord saved = vigilanceRecordRepository.save(record);

        auditLogService.log(officerEmail, "ROLE_VIGILANCE_OFFICER", "VIGILANCE_" + req.getActionType().toUpperCase(),
                "VigilanceRecord", saved.getId(),
                "Action: " + req.getActionType() + " for student: " + req.getStudentName() + ". Reason: " + req.getReason(), ip);

        return saved;
    }

    public List<VigilanceRecord> getAllVigilanceReports() {
        return vigilanceRecordRepository.findAllByOrderByTimestampDesc();
    }

    public List<VigilanceRecord> getWarningsIssued() {
        return vigilanceRecordRepository.findByActionTypeInOrderByTimestampDesc(List.of("ISSUE_WARNING", "WARNING", "WARN"));
    }

    public List<VigilanceRecord> getTerminationsIssued() {
        return vigilanceRecordRepository.findByActionTypeInOrderByTimestampDesc(List.of("TERMINATE_EXAM", "TERMINATE", "TERMINATION"));
    }

    public List<AuditLog> getOfficerActivities() {
        return auditLogRepository.findByPerformedByRoleOrderByTimestampDesc("ROLE_VIGILANCE_OFFICER");
    }

    public List<Map<String, Object>> getStudentTerminations() {
        List<ExamAttempt> terminatedAttempts = examAttemptRepository.findByStatusOrderByStartedAtDesc("TERMINATED_BY_VIOLATION");
        List<Map<String, Object>> result = new ArrayList<>();

        for (ExamAttempt att : terminatedAttempts) {
            Map<String, Object> item = new HashMap<>();
            item.put("attemptId", att.getId());
            item.put("examId", att.getExamId());
            item.put("studentId", att.getStudentId());
            item.put("studentName", att.getStudentName());
            item.put("startedAt", att.getStartedAt());
            item.put("terminatedAt", att.getCompletedAt());
            item.put("violationCount", att.getViolationCount());
            item.put("status", att.getStatus());

            // Get any related vigilance records
            List<VigilanceRecord> records = vigilanceRecordRepository.findByAttemptId(att.getId());
            if (!records.isEmpty()) {
                VigilanceRecord vr = records.get(0);
                item.put("officerName", vr.getOfficerName());
                item.put("officerStaffId", vr.getOfficerStaffId());
                item.put("reason", vr.getReason());
                item.put("officerNotes", vr.getOfficerNotes());
            } else {
                item.put("officerName", "Automated Sentinel");
                item.put("officerStaffId", "SYS-SENTINEL");
                item.put("reason", "Exceeded maximum allowed security violation strikes.");
                item.put("officerNotes", "Auto-terminated by institutional anti-cheat proctoring engine.");
            }
            result.add(item);
        }
        return result;
    }

    public List<Map<String, Object>> getLiveExamMonitoringFeed() {
        List<ExamAttempt> recentAttempts = examAttemptRepository.findAllByOrderByStartedAtDesc();
        List<Map<String, Object>> feed = new ArrayList<>();

        for (ExamAttempt att : recentAttempts) {
            Map<String, Object> map = new HashMap<>();
            map.put("attemptId", att.getId());
            map.put("examId", att.getExamId());
            map.put("studentId", att.getStudentId());
            map.put("studentName", att.getStudentName());
            map.put("startedAt", att.getStartedAt());
            map.put("completedAt", att.getCompletedAt());
            map.put("status", att.getStatus());
            map.put("violationCount", att.getViolationCount());
            map.put("score", att.getScore());
            map.put("passed", att.isPassed());

            // Count tab switches, fullscreen exits, etc. from violations table
            List<ExamViolation> violations = examViolationRepository.findByAttemptId(att.getId());
            map.put("violations", violations);
            feed.add(map);
        }
        return feed;
    }

    // =========================================================================
    // HIERARCHICAL SURVEILLANCE FEED & SURVEILLANCE TREE
    // =========================================================================

    public Map<String, Object> getSurveillanceTree() {
        List<ExamAttempt> allAttempts = examAttemptRepository.findAllByOrderByStartedAtDesc();
        List<Exam> allExams = examRepository.findAll();
        Map<Long, Exam> examMap = new HashMap<>();
        for (Exam e : allExams) {
            examMap.put(e.getId(), e);
        }

        List<Institution> allInstitutions = institutionRepository.findAll();
        Map<String, String> instCodeMap = new HashMap<>();
        for (Institution inst : allInstitutions) {
            if (inst.getName() != null) {
                instCodeMap.put(inst.getName().trim().toLowerCase(), inst.getCode() != null ? inst.getCode() : "INST");
            }
        }

        // Aggregate by institutionName -> examId -> list of student attempts
        Map<String, Map<Long, List<Map<String, Object>>>> instExamTree = new LinkedHashMap<>();

        int totalActiveInstitutions = 0;
        int totalActiveExams = 0;
        int totalLiveStudents = 0;
        int totalWarnings = 0;
        int totalCriticalAlerts = 0;
        int totalDisconnected = 0;

        for (ExamAttempt att : allAttempts) {
            Exam exam = examMap.get(att.getExamId());
            String instName;
            if (exam != null && exam.getInstitutionName() != null && !exam.getInstitutionName().isBlank()) {
                instName = exam.getInstitutionName();
            } else if (att.getStudentId() != null) {
                // Exam has no institution — fall back to the student's own institution
                instName = userRepository.findById(att.getStudentId())
                        .map(User::getInstitutionName)
                        .filter(n -> n != null && !n.isBlank())
                        .orElse("National Examination Board");
            } else {
                instName = "National Examination Board";
            }

            Long examId = att.getExamId() != null ? att.getExamId() : 1L;

            // Fetch violations and vigilance records for this attempt
            List<ExamViolation> violations = examViolationRepository.findByAttemptId(att.getId());
            List<VigilanceRecord> vigilanceRecs = vigilanceRecordRepository.findByAttemptIdOrderByTimestampDesc(att.getId());

            int warningCount = 0;
            boolean hasCriticalAlert = false;
            for (VigilanceRecord vr : vigilanceRecs) {
                if ("ISSUE_WARNING".equalsIgnoreCase(vr.getActionType()) || "WARNING".equalsIgnoreCase(vr.getActionType())) {
                    warningCount++;
                }
                if ("CRITICAL".equalsIgnoreCase(vr.getSeverity()) || "TERMINATE_EXAM".equalsIgnoreCase(vr.getActionType())) {
                    hasCriticalAlert = true;
                }
            }

            boolean isTerminated = "TERMINATED_BY_VIOLATION".equalsIgnoreCase(att.getStatus());
            boolean isSubmitted = "SUBMITTED".equalsIgnoreCase(att.getStatus());
            int examDur = (exam != null && exam.getDurationMinutes() > 0) ? exam.getDurationMinutes() : 60;
            // Student is only live if status is IN_PROGRESS and started recently (within exam duration + 15 min buffer)
            boolean isWithinDuration = att.getStartedAt() != null && att.getStartedAt().isAfter(LocalDateTime.now().minusMinutes(examDur + 15));
            boolean isLive = "IN_PROGRESS".equalsIgnoreCase(att.getStatus()) && isWithinDuration;

            // Media connection simulator / state
            // If candidate has strikes >= 2 or critical alert, mark accordingly
            String alertLevel = "NORMAL";
            if (isTerminated || hasCriticalAlert || att.getViolationCount() >= 3) {
                alertLevel = "CRITICAL";
                if (isLive) totalCriticalAlerts++;
            } else if (warningCount > 0 || att.getViolationCount() > 0) {
                alertLevel = "WARNING";
                if (isLive) totalWarnings++;
            }

            // Connection state
            boolean cameraConnected = isLive;
            boolean screenConnected = isLive;
            boolean audioConnected = isLive;
            boolean networkConnected = true;

            // Mock occasional disconnected state for demo fidelity if student name contains "Disconnected" or specific attempt
            if (att.getStudentName() != null && att.getStudentName().toLowerCase().contains("offline")) {
                networkConnected = false;
                cameraConnected = false;
                screenConnected = false;
                alertLevel = "DISCONNECTED";
                if (isLive) totalDisconnected++;
            }

            if (isLive) {
                totalLiveStudents++;
            }

            Map<String, Object> studentMap = new HashMap<>();
            studentMap.put("attemptId", att.getId());
            studentMap.put("studentId", att.getStudentId());
            studentMap.put("studentName", att.getStudentName());
            studentMap.put("examId", examId);
            studentMap.put("examTitle", exam != null ? exam.getTitle() : "AI & GenAI Proctored Examination");
            studentMap.put("subjectName", exam != null ? exam.getTitle() : "Computer Science");
            studentMap.put("institutionName", instName);
            studentMap.put("status", att.getStatus());
            studentMap.put("startedAt", att.getStartedAt());
            studentMap.put("completedAt", att.getCompletedAt());
            studentMap.put("violationCount", att.getViolationCount());
            studentMap.put("warningCount", warningCount);
            studentMap.put("alertLevel", alertLevel);
            studentMap.put("isLive", isLive);
            LiveStreamFrame streamFrame = liveStreamFrames.get(att.getId());
            boolean hasActiveStream = streamFrame != null && (System.currentTimeMillis() - streamFrame.getTimestamp() < 45000);
            if (hasActiveStream) {
                studentMap.put("cameraFrame", streamFrame.getCameraFrame());
                studentMap.put("screenFrame", streamFrame.getScreenFrame());
                if (streamFrame.isCameraConnected()) cameraConnected = true;
                if (streamFrame.isScreenConnected()) screenConnected = true;
            } else {
                studentMap.put("cameraFrame", null);
                studentMap.put("screenFrame", null);
            }

            studentMap.put("cameraConnected", cameraConnected);
            studentMap.put("screenConnected", screenConnected);
            studentMap.put("audioConnected", audioConnected);
            studentMap.put("networkConnected", networkConnected);
            studentMap.put("audioMuted", false);
            studentMap.put("durationMinutes", exam != null ? exam.getDurationMinutes() : 45);
            studentMap.put("violations", violations);
            studentMap.put("vigilanceRecords", vigilanceRecs);

            // Construct chronological timeline
            List<Map<String, Object>> timeline = new ArrayList<>();
            Map<String, Object> startEvent = new HashMap<>();
            startEvent.put("timestamp", att.getStartedAt());
            startEvent.put("title", "Candidate Initiated Proctored Assessment");
            startEvent.put("type", "START");
            startEvent.put("details", "Hardware pre-checks passed. Fullscreen mode activated.");
            timeline.add(startEvent);

            for (ExamViolation v : violations) {
                Map<String, Object> vEvent = new HashMap<>();
                vEvent.put("timestamp", v.getTimestamp());
                vEvent.put("title", "Integrity Anomaly: " + v.getViolationType());
                vEvent.put("type", "VIOLATION");
                vEvent.put("details", v.getDetails());
                timeline.add(vEvent);
            }

            for (VigilanceRecord vr : vigilanceRecs) {
                Map<String, Object> vrEvent = new HashMap<>();
                vrEvent.put("timestamp", vr.getTimestamp());
                vrEvent.put("title", "Officer Action: " + vr.getActionType() + " (" + vr.getSeverity() + ")");
                vrEvent.put("type", vr.getActionType());
                vrEvent.put("details", vr.getReason() != null ? vr.getReason() : (vr.getChatMessage() != null ? vr.getChatMessage() : "Vigilance Intervention"));
                vrEvent.put("officerName", vr.getOfficerName());
                vrEvent.put("evidenceId", vr.getEvidenceId());
                timeline.add(vrEvent);
            }

            timeline.sort((a, b) -> {
                LocalDateTime tA = (LocalDateTime) a.get("timestamp");
                LocalDateTime tB = (LocalDateTime) b.get("timestamp");
                if (tA == null) return 1;
                if (tB == null) return -1;
                return tB.compareTo(tA);
            });
            studentMap.put("timeline", timeline);

            instExamTree.computeIfAbsent(instName, k -> new LinkedHashMap<>())
                    .computeIfAbsent(examId, k -> new ArrayList<>())
                    .add(studentMap);
        }

        totalActiveInstitutions = instExamTree.size();
        for (Map<Long, List<Map<String, Object>>> examList : instExamTree.values()) {
            totalActiveExams += examList.size();
        }

        // Format hierarchical list of institutions
        List<Map<String, Object>> institutionsList = new ArrayList<>();
        for (Map.Entry<String, Map<Long, List<Map<String, Object>>>> instEntry : instExamTree.entrySet()) {
            String instName = instEntry.getKey();
            Map<Long, List<Map<String, Object>>> examsUnderInst = instEntry.getValue();

            int instLiveCount = 0;
            int instWarningCount = 0;
            int instCriticalCount = 0;
            int instDisconnectedCount = 0;

            List<Map<String, Object>> examHierarchyList = new ArrayList<>();

            for (Map.Entry<Long, List<Map<String, Object>>> examEntry : examsUnderInst.entrySet()) {
                Long examId = examEntry.getKey();
                List<Map<String, Object>> students = examEntry.getValue();

                // Sort students by priority: CRITICAL -> WARNING -> DISCONNECTED -> NORMAL
                students.sort((a, b) -> {
                    String aL = (String) a.get("alertLevel");
                    String bL = (String) b.get("alertLevel");
                    int rankA = "CRITICAL".equals(aL) ? 0 : ("WARNING".equals(aL) ? 1 : ("DISCONNECTED".equals(aL) ? 2 : 3));
                    int rankB = "CRITICAL".equals(bL) ? 0 : ("WARNING".equals(bL) ? 1 : ("DISCONNECTED".equals(bL) ? 2 : 3));
                    return Integer.compare(rankA, rankB);
                });

                int eLive = 0;
                int eWarn = 0;
                int eCrit = 0;
                int eDisc = 0;
                for (Map<String, Object> st : students) {
                    boolean isLive = Boolean.TRUE.equals(st.get("isLive"));
                    if (isLive) {
                        eLive++;
                        if ("CRITICAL".equals(st.get("alertLevel"))) eCrit++;
                        if ("WARNING".equals(st.get("alertLevel"))) eWarn++;
                        if ("DISCONNECTED".equals(st.get("alertLevel"))) eDisc++;
                    }
                }

                instLiveCount += eLive;
                instWarningCount += eWarn;
                instCriticalCount += eCrit;
                instDisconnectedCount += eDisc;

                Exam ex = examMap.get(examId);
                Map<String, Object> examObj = new HashMap<>();
                examObj.put("examId", examId);
                examObj.put("examTitle", ex != null ? ex.getTitle() : "Proctored Examination");
                examObj.put("durationMinutes", ex != null ? ex.getDurationMinutes() : 45);
                examObj.put("liveStudentsCount", eLive);
                examObj.put("warningCount", eWarn);
                examObj.put("criticalCount", eCrit);
                examObj.put("disconnectedCount", eDisc);
                examObj.put("totalEnrolled", students.size());
                examObj.put("students", students);
                examHierarchyList.add(examObj);
            }

            Map<String, Object> instObj = new HashMap<>();
            instObj.put("institutionName", instName);
            instObj.put("code", instCodeMap.getOrDefault(instName.trim().toLowerCase(), "INST"));
            instObj.put("activeExamsCount", examsUnderInst.size());
            instObj.put("liveStudentsCount", instLiveCount);
            instObj.put("warningCount", instWarningCount);
            instObj.put("criticalCount", instCriticalCount);
            instObj.put("disconnectedCount", instDisconnectedCount);
            instObj.put("exams", examHierarchyList);
            institutionsList.add(instObj);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("activeInstitutions", totalActiveInstitutions);
        response.put("activeExams", totalActiveExams);
        response.put("liveStudents", totalLiveStudents);
        response.put("warnings", totalWarnings);
        response.put("criticalAlerts", totalCriticalAlerts);
        response.put("disconnected", totalDisconnected);
        response.put("institutions", institutionsList);

        return response;
    }

    // =========================================================================
    // EVIDENCE CAPTURE & REPOSITORY
    // =========================================================================

    @Transactional
    public VigilanceRecord captureEvidence(EvidenceCaptureRequest req, String officerEmail, String ip) {
        User officer = userRepository.findByEmail(officerEmail).orElse(null);
        String officerName = officer != null ? officer.getFullName() : "Vigilance Officer";
        String officerStaffId = officer != null && officer.getStaffId() != null ? officer.getStaffId() : "VO-001";
        Long officerId = officer != null ? officer.getId() : 0L;

        String evidenceId = "EVD-" + System.currentTimeMillis() % 1000000 + "-" + (req.getAttemptId() != null ? req.getAttemptId() : 0L);

        VigilanceRecord record = VigilanceRecord.builder()
                .officerId(officerId)
                .officerName(officerName)
                .officerStaffId(officerStaffId)
                .studentId(req.getStudentId() != null ? req.getStudentId() : 0L)
                .studentName(req.getStudentName() != null ? req.getStudentName() : "Student")
                .examId(req.getExamId())
                .examTitle(req.getExamTitle() != null ? req.getExamTitle() : "Proctored Examination")
                .attemptId(req.getAttemptId())
                .actionType("CAPTURE_EVIDENCE")
                .severity("HIGH")
                .reason(req.getReason() != null ? req.getReason() : "Security surveillance evidence captured by officer.")
                .officerNotes(req.getOfficerNotes())
                .evidenceId(evidenceId)
                .evidenceSnapshot(req.getEvidenceSnapshot())
                .timestamp(LocalDateTime.now())
                .build();

        VigilanceRecord saved = vigilanceRecordRepository.save(record);
        auditLogService.log(officerEmail, "ROLE_VIGILANCE_OFFICER", "VIGILANCE_EVIDENCE_CAPTURED",
                "VigilanceRecord", saved.getId(), "Captured Evidence ID " + evidenceId + " for attempt " + req.getAttemptId(), ip);

        log.info("Vigilance Officer {} captured evidence {} for attempt {}", officerStaffId, evidenceId, req.getAttemptId());
        return saved;
    }

    public List<VigilanceRecord> getAllEvidence() {
        return vigilanceRecordRepository.findByEvidenceIdIsNotNullOrderByTimestampDesc();
    }

    // =========================================================================
    // CANDIDATE REAL-TIME CHAT
    // =========================================================================

    @Transactional
    public VigilanceRecord sendExamChat(SendChatRequest req, String officerEmail, String ip) {
        User sender = userRepository.findByEmail(officerEmail).orElse(null);
        boolean isStudent = sender != null && sender.getRole() == Role.ROLE_STUDENT;

        Long officerId = 0L;
        String officerName;
        String officerStaffId;
        String reason;
        String auditRole;
        Long studentId = req.getStudentId() != null ? req.getStudentId() : 0L;
        String studentName = req.getStudentName() != null ? req.getStudentName() : "Student";

        if (isStudent) {
            officerStaffId = "CANDIDATE";
            officerName = sender.getFullName() != null ? sender.getFullName() : "Candidate";
            reason = "STUDENT_REPLY";
            auditRole = "ROLE_STUDENT";
            if (studentId == 0L && sender != null) {
                studentId = sender.getId();
            }
            if ("Student".equals(studentName) && sender != null) {
                studentName = sender.getFullName();
            }
        } else {
            officerId = sender != null ? sender.getId() : 0L;
            officerName = sender != null ? sender.getFullName() : "Vigilance Officer";
            officerStaffId = sender != null && sender.getStaffId() != null ? sender.getStaffId() : "VO-001";
            reason = "Direct communication sent from vigilance officer.";
            auditRole = "ROLE_VIGILANCE_OFFICER";
        }

        VigilanceRecord record = VigilanceRecord.builder()
                .officerId(officerId)
                .officerName(officerName)
                .officerStaffId(officerStaffId)
                .studentId(studentId)
                .studentName(studentName)
                .examId(req.getExamId())
                .examTitle("Proctored Examination")
                .attemptId(req.getAttemptId())
                .actionType("CHAT_MESSAGE")
                .severity("LOW")
                .chatMessage(req.getMessage())
                .reason(reason)
                .timestamp(LocalDateTime.now())
                .build();

        VigilanceRecord saved = vigilanceRecordRepository.save(record);
        auditLogService.log(officerEmail, auditRole, "VIGILANCE_CHAT_SENT",
                "VigilanceRecord", saved.getId(), "Chat in attempt #" + req.getAttemptId() + ": " + req.getMessage(), ip);

        return saved;
    }

    public List<VigilanceRecord> getExamChat(Long attemptId) {
        return vigilanceRecordRepository.findByAttemptIdAndActionTypeInOrderByTimestampDesc(
                attemptId, List.of("CHAT_MESSAGE"));
    }

    // =========================================================================
    // STUDENT INTERVENTIONS & SYNCHRONIZATION (Used by ProctoredExamPage)
    // =========================================================================

    public Map<String, Object> getStudentInterventions(Long attemptId) {
        Map<String, Object> result = new HashMap<>();

        // Check if attempt exists and its status
        Optional<ExamAttempt> attOpt = examAttemptRepository.findById(attemptId);
        boolean isTerminated = false;
        String terminationReason = null;

        if (attOpt.isPresent()) {
            ExamAttempt att = attOpt.get();
            isTerminated = "TERMINATED_BY_VIOLATION".equalsIgnoreCase(att.getStatus());
        }

        // Get latest unacknowledged warning & check termination records
        List<VigilanceRecord> records = vigilanceRecordRepository.findByAttemptIdOrderByTimestampDesc(attemptId);
        VigilanceRecord unacknowledgedWarning = null;
        List<Map<String, Object>> chatMessages = new ArrayList<>();

        for (VigilanceRecord vr : records) {
            if (("ISSUE_WARNING".equalsIgnoreCase(vr.getActionType()) || "WARNING".equalsIgnoreCase(vr.getActionType()))
                    && !vr.isAcknowledged() && unacknowledgedWarning == null) {
                unacknowledgedWarning = vr;
            }
            if ("TERMINATE_EXAM".equalsIgnoreCase(vr.getActionType())) {
                isTerminated = true;
                if (terminationReason == null) {
                    terminationReason = vr.getReason();
                }
            }
            if ("CHAT_MESSAGE".equalsIgnoreCase(vr.getActionType())) {
                Map<String, Object> cm = new HashMap<>();
                cm.put("id", vr.getId());
                cm.put("officerName", vr.getOfficerName());
                cm.put("officerStaffId", vr.getOfficerStaffId());
                cm.put("studentName", vr.getStudentName());
                cm.put("message", vr.getChatMessage());
                cm.put("chatMessage", vr.getChatMessage());
                cm.put("reason", vr.getReason());
                cm.put("timestamp", vr.getTimestamp());
                chatMessages.add(cm);
            }
        }

        result.put("isTerminated", isTerminated);
        result.put("terminationReason", terminationReason != null ? terminationReason : "Terminated due to multiple security violations.");
        result.put("activeWarning", unacknowledgedWarning);
        result.put("chatMessages", chatMessages);

        return result;
    }

    @Transactional
    public void acknowledgeWarning(Long recordId, Long studentId) {
        vigilanceRecordRepository.findById(recordId).ifPresent(record -> {
            record.setAcknowledged(true);
            vigilanceRecordRepository.save(record);
            log.info("Warning #{} acknowledged by student #{}", recordId, studentId);
        });
    }
}
