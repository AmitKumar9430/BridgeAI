package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "live_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LiveSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true)
    @Builder.Default
    private Long courseId = 1L;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Long trainerId;

    @Column(length = 120)
    private String trainerEmail;

    @Column(length = 100)
    private String trainerName;

    private Long institutionId;

    @Column(length = 150)
    private String institutionName;

    @Column(length = 50)
    @Builder.Default
    private String creatorRole = "ROLE_TRAINER"; // ROLE_BOSS_ADMIN, ROLE_SUPER_ADMIN, ROLE_TRAINER

    @Column(length = 100)
    @Builder.Default
    private String targetAudience = "All Enrolled Students";

    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    @Builder.Default
    private int durationMinutes = 60;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String platform = "GOOGLE_MEET"; // GOOGLE_MEET, ZOOM, MS_TEAMS, WEBEX, OTHER

    @Column(nullable = false, length = 500)
    private String joinUrl;

    @Column(length = 50)
    private String meetingPasscode;

    @Column(length = 150)
    private String subjectName;

    @Column(length = 500)
    private String recordingVideoUrl;

    @Column(columnDefinition = "TEXT")
    private String recordingNotes;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "UPCOMING"; // UPCOMING, LIVE, COMPLETED, CANCELLED

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
