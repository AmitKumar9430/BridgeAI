package com.bridgeai.portal.service;

import com.bridgeai.portal.model.AuditLog;
import com.bridgeai.portal.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void log(String email, String role, String action, String entityName, Long entityId, String details, String ip) {
        AuditLog audit = AuditLog.builder()
                .performedByEmail(email)
                .performedByRole(role)
                .action(action)
                .entityName(entityName)
                .entityId(entityId)
                .details(details)
                .ipAddress(ip)
                .build();
        auditLogRepository.save(audit);
    }

    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop100ByOrderByTimestampDesc();
    }
}
