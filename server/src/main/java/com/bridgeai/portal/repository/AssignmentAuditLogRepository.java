package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.AssignmentAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentAuditLogRepository extends JpaRepository<AssignmentAuditLog, Long> {
    List<AssignmentAuditLog> findAllByOrderByTimestampDesc();
    List<AssignmentAuditLog> findByAssignmentIdOrderByTimestampDesc(Long assignmentId);
    List<AssignmentAuditLog> findByStudentIdOrderByTimestampDesc(Long studentId);
    List<AssignmentAuditLog> findByTrainerIdOrderByTimestampDesc(Long trainerId);
}
