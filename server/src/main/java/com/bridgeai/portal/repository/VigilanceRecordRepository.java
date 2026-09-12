package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.VigilanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VigilanceRecordRepository extends JpaRepository<VigilanceRecord, Long> {
    List<VigilanceRecord> findAllByOrderByTimestampDesc();
    List<VigilanceRecord> findByOfficerIdOrderByTimestampDesc(Long officerId);
    List<VigilanceRecord> findByStudentIdOrderByTimestampDesc(Long studentId);
    List<VigilanceRecord> findByStudentEmailOrderByTimestampDesc(String studentEmail);
    List<VigilanceRecord> findByActionTypeOrderByTimestampDesc(String actionType);
    List<VigilanceRecord> findByActionTypeInOrderByTimestampDesc(List<String> actionTypes);
    List<VigilanceRecord> findByAttemptId(Long attemptId);
    List<VigilanceRecord> findByAttemptIdOrderByTimestampDesc(Long attemptId);
    List<VigilanceRecord> findByAttemptIdAndActionTypeInOrderByTimestampDesc(Long attemptId, List<String> actionTypes);
    List<VigilanceRecord> findByEvidenceIdIsNotNullOrderByTimestampDesc();
}
