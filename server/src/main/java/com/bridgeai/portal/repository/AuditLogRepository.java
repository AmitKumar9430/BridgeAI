package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findAllByOrderByTimestampDesc();
    List<AuditLog> findTop100ByOrderByTimestampDesc();
    List<AuditLog> findByPerformedByRoleOrderByTimestampDesc(String performedByRole);
    List<AuditLog> findTop100ByInstitutionIdOrderByTimestampDesc(Long institutionId);
    List<AuditLog> findTop100ByInstitutionNameOrderByTimestampDesc(String institutionName);
    long countByInstitutionId(Long institutionId);
    long countByInstitutionName(String institutionName);
}
