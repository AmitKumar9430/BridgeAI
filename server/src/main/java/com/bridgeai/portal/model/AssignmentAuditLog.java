package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assignment_audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long assignmentId;

    @Column(length = 200)
    private String assignmentTitle;

    private Long submissionId;

    private Long studentId;

    @Column(length = 100)
    private String studentName;

    private Long trainerId;

    @Column(length = 100)
    private String trainerName;

    @Column(nullable = false, length = 60)
    private String actionType;

    @Column(length = 255)
    private String permissionDetails;

    @Column(columnDefinition = "TEXT")
    private String editDetails;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
