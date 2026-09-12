package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.ExamViolation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamViolationRepository extends JpaRepository<ExamViolation, Long> {
    List<ExamViolation> findByAttemptIdOrderByTimestampAsc(Long attemptId);
    List<ExamViolation> findByAttemptId(Long attemptId);
    long countByAttemptId(Long attemptId);
}
