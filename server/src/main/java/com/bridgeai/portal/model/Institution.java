package com.bridgeai.portal.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "institutions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Institution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String name;

    @Column(length = 30)
    private String code; // e.g. IIT-D, NIT-T, BITS-P

    @Column(length = 100)
    private String category; // e.g. Institute of National Importance, Central University

    @Column(length = 100)
    private String accreditation; // e.g. NAAC A++ | NIRF Rank #1

    @Column(length = 120)
    private String contactEmail;

    @Column(length = 25)
    private String contactPhone;

    @Column(length = 200)
    private String websiteUrl;

    private Integer establishedYear;

    // Campus Location Details
    @Column(length = 255)
    private String campusAddress;

    @Column(length = 80)
    private String city;

    @Column(length = 80)
    private String state;

    @Column(length = 20)
    private String postalCode;

    @Column(length = 50)
    @Builder.Default
    private String country = "India";

    @Column(length = 30)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, UNDER_VERIFICATION, SUSPENDED

    @Builder.Default
    private int maxStrikesAllowed = 3; // Institutional proctoring strikes quota decided by Boss Admin

    @Column(length = 1000)
    private String description;

    @Column(length = 255)
    private String logoUrl;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
