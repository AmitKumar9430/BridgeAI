package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.ExamAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, Long> {
    List<ExamAttempt> findByExamId(Long examId);
    List<ExamAttempt> findByStudentId(Long studentId);
    List<ExamAttempt> findByStudentIdOrderByStartedAtDesc(Long studentId);
    Optional<ExamAttempt> findByExamIdAndStudentId(Long examId, Long studentId);
    Optional<ExamAttempt> findTopByExamIdAndStudentIdOrderByStartedAtDesc(Long examId, Long studentId);
    List<ExamAttempt> findByExamIdAndStudentIdOrderByStartedAtDesc(Long examId, Long studentId);
    List<ExamAttempt> findAllByOrderByStartedAtDesc();
    List<ExamAttempt> findByStatusOrderByStartedAtDesc(String status);
}
