package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.AssignmentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, Long> {
    List<AssignmentSubmission> findByAssignmentId(Long assignmentId);
    List<AssignmentSubmission> findByStudentId(Long studentId);
    Optional<AssignmentSubmission> findByAssignmentIdAndStudentId(Long assignmentId, Long studentId);
    List<AssignmentSubmission> findByInstitutionIdOrderBySubmittedAtDesc(Long institutionId);
    List<AssignmentSubmission> findByInstitutionNameOrderBySubmittedAtDesc(String institutionName);
    long countByInstitutionId(Long institutionId);
    long countByInstitutionName(String institutionName);
}
