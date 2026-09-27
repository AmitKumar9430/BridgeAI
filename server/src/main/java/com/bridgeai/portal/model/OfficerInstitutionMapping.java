package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "officer_institution_mappings",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"officer_id", "institution_id"})
    },
    indexes = {
        @Index(name = "idx_oim_officer", columnList = "officer_id"),
        @Index(name = "idx_oim_inst", columnList = "institution_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OfficerInstitutionMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "officer_id", nullable = false)
    private Long officerId;

    @Column(name = "institution_id", nullable = false)
    private Long institutionId;

    @Column(length = 150)
    private String institutionName;

    @Column(length = 50)
    private String institutionCode;

    @Column(length = 120)
    private String assignedBy; // email of Boss Admin who assigned

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime assignedAt = LocalDateTime.now();
}
