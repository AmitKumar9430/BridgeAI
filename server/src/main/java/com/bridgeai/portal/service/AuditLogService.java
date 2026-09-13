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
    private final com.bridgeai.portal.repository.UserRepository userRepository;

    public void log(String email, String role, String action, String entityName, Long entityId, String details, String ip) {
        Long instId = null;
        String instName = null;
        if (email != null && !email.isBlank()) {
            com.bridgeai.portal.model.User user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                instId = user.getInstitutionId();
                instName = user.getInstitutionName();
            }
        }

        AuditLog audit = AuditLog.builder()
                .performedByEmail(email)
                .performedByRole(role)
                .institutionId(instId)
                .institutionName(instName)
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

    public List<AuditLog> getRecentLogs(com.bridgeai.portal.model.User user) {
        if (user == null || user.getRole() == com.bridgeai.portal.model.Role.ROLE_BOSS_ADMIN) {
            return auditLogRepository.findTop100ByOrderByTimestampDesc();
        }
        if (user.getInstitutionId() != null) {
            return auditLogRepository.findTop100ByInstitutionIdOrderByTimestampDesc(user.getInstitutionId());
        }
        if (user.getInstitutionName() != null && !user.getInstitutionName().isBlank()) {
            return auditLogRepository.findTop100ByInstitutionNameOrderByTimestampDesc(user.getInstitutionName());
        }
        return auditLogRepository.findTop100ByOrderByTimestampDesc();
    }
}
