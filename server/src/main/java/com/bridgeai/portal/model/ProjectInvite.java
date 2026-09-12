package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_invites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long teamId;

    @Column(nullable = false)
    private Long topicId;

    @Column(length = 100)
    private String teamName;

    @Column(nullable = false)
    private Long senderId;

    @Column(length = 100)
    private String senderName;

    @Column(nullable = false)
    private Long recipientId;

    @Column(length = 100)
    private String recipientName;

    @Column(length = 150)
    private String recipientEmail;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, ACCEPTED, DECLINED, CANCELLED, EXPIRED

    private LocalDateTime expiresAt;

    private LocalDateTime respondedAt;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
