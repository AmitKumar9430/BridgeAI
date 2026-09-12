package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.LiveSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LiveSessionRepository extends JpaRepository<LiveSession, Long> {
    List<LiveSession> findByCourseId(Long courseId);
    List<LiveSession> findAllByOrderByScheduledAtAsc();
    List<LiveSession> findAllByOrderByScheduledAtDesc();
    List<LiveSession> findByInstitutionIdOrderByScheduledAtDesc(Long institutionId);
    List<LiveSession> findByTrainerIdOrderByScheduledAtDesc(Long trainerId);
    List<LiveSession> findBySubjectNameIgnoreCaseOrderByScheduledAtDesc(String subjectName);
}
