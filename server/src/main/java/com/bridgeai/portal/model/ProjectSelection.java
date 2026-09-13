package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_selections",
       uniqueConstraints = {@UniqueConstraint(columnNames = {"topicId", "studentId"})})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectSelection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long topicId;

    @Column(nullable = false)
    private Long studentId;

    @Column(length = 100)
    private String studentName;

    @Column(length = 150)
    private String studentEmail;

    private Long institutionId;

    @Column(length = 150)
    private String institutionName;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime selectedAt = LocalDateTime.now();
}
