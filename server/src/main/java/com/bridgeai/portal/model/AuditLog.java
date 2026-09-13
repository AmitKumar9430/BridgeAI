package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 120)
    private String performedByEmail;

    @Column(length = 40)
    private String performedByRole;

    private Long institutionId;

    @Column(length = 150)
    private String institutionName;

    @Column(nullable = false, length = 80)
    private String action; // USER_REGISTERED, OTP_SENT, LOGIN_OTP_SUCCESS, EXAM_STARTED, EXAM_VIOLATION, EXAM_SUBMITTED, COURSE_CREATED

    @Column(length = 100)
    private String entityName;

    private Long entityId;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(length = 60)
    private String ipAddress;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
