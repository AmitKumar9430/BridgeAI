package com.bridgeai.portal.service;

import com.bridgeai.portal.model.LiveSession;
import com.bridgeai.portal.repository.LiveSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LiveSessionService {

    private final LiveSessionRepository liveSessionRepository;

    public List<LiveSession> getAllUpcomingSessions() {
        return liveSessionRepository.findAllByOrderByScheduledAtAsc();
    }

    public List<LiveSession> getAllSessions() {
        return liveSessionRepository.findAllByOrderByScheduledAtDesc();
    }

    public List<LiveSession> getSessionsByCourse(Long courseId) {
        return liveSessionRepository.findByCourseId(courseId);
    }

    public List<LiveSession> getSessionsByInstitution(Long institutionId) {
        return liveSessionRepository.findByInstitutionIdOrderByScheduledAtDesc(institutionId);
    }

    public List<LiveSession> getSessionsByTrainer(Long trainerId) {
        return liveSessionRepository.findByTrainerIdOrderByScheduledAtDesc(trainerId);
    }

    public LiveSession getSessionById(Long id) {
        return liveSessionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Live session not found: " + id));
    }

    public List<LiveSession> getSessionsForRole(String role, Long institutionId) {
        List<LiveSession> all = liveSessionRepository.findAllByOrderByScheduledAtDesc();
        if (role == null || role.isBlank() || "ROLE_BOSS_ADMIN".equals(role)) {
            return all;
        }
        return all.stream().filter(s -> {
            String cRole = s.getCreatorRole();
            if (cRole == null || cRole.isBlank()) cRole = "ROLE_TRAINER";

            // If Boss Admin scheduled: Super Admin, Trainer, and Student will join
            if ("ROLE_BOSS_ADMIN".equals(cRole)) {
                return true;
            }

            // If Super Admin scheduled: Trainer and Student will join (and Super Admin sees it)
            if ("ROLE_SUPER_ADMIN".equals(cRole)) {
                if ("ROLE_SUPER_ADMIN".equals(role) || "ROLE_TRAINER".equals(role) || "ROLE_STUDENT".equals(role)) {
                    if (institutionId != null && s.getInstitutionId() != null) {
                        return s.getInstitutionId().equals(institutionId);
                    }
                    return true;
                }
                return false;
            }

            // If Trainer scheduled: Students will join (and Trainer / Super Admin sees it)
            if ("ROLE_TRAINER".equals(cRole)) {
                if ("ROLE_STUDENT".equals(role) || "ROLE_TRAINER".equals(role) || "ROLE_SUPER_ADMIN".equals(role)) {
                    if (institutionId != null && s.getInstitutionId() != null) {
                        return s.getInstitutionId().equals(institutionId);
                    }
                    return true;
                }
                return false;
            }

            return true;
        }).toList();
    }

    @Transactional
    public LiveSession scheduleSession(LiveSession session) {
        session.setCreatedAt(LocalDateTime.now());
        if (session.getStatus() == null || session.getStatus().isBlank()) {
            session.setStatus("UPCOMING");
        }
        if (session.getCourseId() == null) {
            session.setCourseId(1L);
        }
        if (session.getPlatform() == null || session.getPlatform().isBlank()) {
            session.setPlatform("GOOGLE_MEET");
        }
        if (session.getTargetAudience() == null || session.getTargetAudience().isBlank()) {
            session.setTargetAudience("All Enrolled Students");
        }
        return liveSessionRepository.save(session);
    }

    @Transactional
    public LiveSession updateSession(Long id, LiveSession updated) {
        LiveSession session = getSessionById(id);
        if (updated.getTitle() != null && !updated.getTitle().isBlank()) {
            session.setTitle(updated.getTitle());
        }
        if (updated.getDescription() != null) {
            session.setDescription(updated.getDescription());
        }
        if (updated.getPlatform() != null && !updated.getPlatform().isBlank()) {
            session.setPlatform(updated.getPlatform());
        }
        if (updated.getJoinUrl() != null && !updated.getJoinUrl().isBlank()) {
            session.setJoinUrl(updated.getJoinUrl());
        }
        if (updated.getMeetingPasscode() != null) {
            session.setMeetingPasscode(updated.getMeetingPasscode());
        }
        if (updated.getScheduledAt() != null) {
            session.setScheduledAt(updated.getScheduledAt());
        }
        if (updated.getDurationMinutes() > 0) {
            session.setDurationMinutes(updated.getDurationMinutes());
        }
        if (updated.getSubjectName() != null) {
            session.setSubjectName(updated.getSubjectName());
        }
        if (updated.getTargetAudience() != null) {
            session.setTargetAudience(updated.getTargetAudience());
        }
        if (updated.getTrainerName() != null) {
            session.setTrainerName(updated.getTrainerName());
        }
        if (updated.getInstitutionName() != null) {
            session.setInstitutionName(updated.getInstitutionName());
        }
        if (updated.getStatus() != null && !updated.getStatus().isBlank()) {
            session.setStatus(updated.getStatus());
        }
        if (updated.getRecordingVideoUrl() != null) {
            session.setRecordingVideoUrl(updated.getRecordingVideoUrl());
        }
        if (updated.getRecordingNotes() != null) {
            session.setRecordingNotes(updated.getRecordingNotes());
        }
        return liveSessionRepository.save(session);
    }

    @Transactional
    public void deleteSession(Long id) {
        LiveSession session = getSessionById(id);
        liveSessionRepository.delete(session);
    }

    @Transactional
    public LiveSession updateStatus(Long sessionId, String status) {
        LiveSession session = getSessionById(sessionId);
        session.setStatus(status);
        return liveSessionRepository.save(session);
    }

    @Transactional
    public LiveSession updateRecording(Long sessionId, String recordingVideoUrl, String recordingNotes) {
        LiveSession session = getSessionById(sessionId);
        session.setRecordingVideoUrl(recordingVideoUrl);
        if (recordingNotes != null) {
            session.setRecordingNotes(recordingNotes);
        }
        session.setStatus("RECORDED");
        return liveSessionRepository.save(session);
    }
}
