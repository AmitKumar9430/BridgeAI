package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_team_members",
       uniqueConstraints = {@UniqueConstraint(columnNames = {"topicId", "studentId"})})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long teamId;

    @Column(nullable = false)
    private Long topicId;

    @Column(nullable = false)
    private Long studentId;

    @Column(length = 100)
    private String studentName;

    @Column(length = 150)
    private String studentEmail;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String role = "MEMBER"; // LEADER, MEMBER

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime joinedAt = LocalDateTime.now();
}
