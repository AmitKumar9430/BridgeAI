package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vigilance_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VigilanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long officerId;

    @Column(length = 100)
    private String officerName;

    @Column(length = 50)
    private String officerStaffId;

    @Column(nullable = false)
    private Long studentId;

    @Column(length = 100)
    private String studentName;

    @Column(length = 120)
    private String studentEmail;

    private Long examId;

    @Column(length = 200)
    private String examTitle;

    private Long attemptId;

    @Column(nullable = false, length = 40)
    private String actionType; // ISSUE_WARNING, TERMINATE_EXAM, FLAG_SUSPICIOUS

    @Column(length = 30)
    @Builder.Default
    private String severity = "HIGH"; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String officerNotes;

    @Column(length = 60)
    private String evidenceId;

    @Column(columnDefinition = "LONGTEXT")
    private String evidenceSnapshot; // Base64 image snapshot

    @Column(columnDefinition = "TEXT")
    private String chatMessage;

    @Builder.Default
    private boolean acknowledged = false;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
