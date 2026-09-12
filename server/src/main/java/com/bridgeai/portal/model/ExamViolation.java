package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_violations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamViolation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long attemptId;

    @Column(nullable = false)
    private Long studentId;

    @Column(nullable = false, length = 50)
    private String violationType; // TAB_SWITCH, FULLSCREEN_EXIT, COPY_PASTE, RIGHT_CLICK, DEVTOOLS_OPEN, MULTIPLE_FACES

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
