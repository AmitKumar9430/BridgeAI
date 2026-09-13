package com.bridgeai.portal.security;

import com.bridgeai.portal.model.ResourceItem;
import com.bridgeai.portal.model.Role;
import com.bridgeai.portal.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.*;

class InstitutionSecurityUtilsTest {

    private InstitutionSecurityUtils securityUtils;

    private User bossAdmin;
    private User iitSuperAdmin;
    private User nitSuperAdmin;
    private User iitTrainer;
    private User nitTrainer;
    private User iitStudent;
    private User nitStudent;

    @BeforeEach
    void setUp() {
        securityUtils = new InstitutionSecurityUtils();

        bossAdmin = User.builder()
                .id(1L)
                .email("boss@bridgeai.edu")
                .role(Role.ROLE_BOSS_ADMIN)
                .institutionName("National Higher Education Board")
                .build();

        iitSuperAdmin = User.builder()
                .id(2L)
                .email("superadmin@bridgeai.edu")
                .role(Role.ROLE_SUPER_ADMIN)
                .institutionId(101L)
                .institutionName("Indian Institute of Technology (IIT)")
                .build();

        nitSuperAdmin = User.builder()
                .id(3L)
                .email("nit.superadmin@bridgeai.edu")
                .role(Role.ROLE_SUPER_ADMIN)
                .institutionId(102L)
                .institutionName("National Institute of Tech (NIT)")
                .build();

        iitTrainer = User.builder()
                .id(4L)
                .email("bharat.trainer@bridgeai.edu")
                .role(Role.ROLE_TRAINER)
                .institutionId(101L)
                .institutionName("Indian Institute of Technology (IIT)")
                .build();

        nitTrainer = User.builder()
                .id(5L)
                .email("anita.trainer@bridgeai.edu")
                .role(Role.ROLE_TRAINER)
                .institutionId(102L)
                .institutionName("National Institute of Tech (NIT)")
                .build();

        iitStudent = User.builder()
                .id(6L)
                .email("rahul.student@bridgeai.edu")
                .role(Role.ROLE_STUDENT)
                .institutionId(101L)
                .institutionName("Indian Institute of Technology (IIT)")
                .build();

        nitStudent = User.builder()
                .id(7L)
                .email("kavita.student@bridgeai.edu")
                .role(Role.ROLE_STUDENT)
                .institutionId(102L)
                .institutionName("National Institute of Tech (NIT)")
                .build();
    }

    @Test
    @DisplayName("Boss Admin can access any institution resources")
    void testBossAdminGlobalAccess() {
        assertTrue(securityUtils.isAllowedInstitution(bossAdmin, 101L, "Indian Institute of Technology (IIT)"));
        assertTrue(securityUtils.isAllowedInstitution(bossAdmin, 102L, "National Institute of Tech (NIT)"));
        assertDoesNotThrow(() -> securityUtils.assertInstitutionAccess(bossAdmin, 101L, "Indian Institute of Technology (IIT)"));
        assertDoesNotThrow(() -> securityUtils.assertInstitutionAccess(bossAdmin, 102L, "National Institute of Tech (NIT)"));
    }

    @Test
    @DisplayName("IIT Super Admin can access IIT resources but strictly rejected from NIT")
    void testSuperAdminIsolation() {
        assertTrue(securityUtils.isAllowedInstitution(iitSuperAdmin, 101L, "Indian Institute of Technology (IIT)"));
        assertFalse(securityUtils.isAllowedInstitution(iitSuperAdmin, 102L, "National Institute of Tech (NIT)"));

        assertDoesNotThrow(() -> securityUtils.assertInstitutionAccess(iitSuperAdmin, 101L, "Indian Institute of Technology (IIT)"));
        assertThrows(AccessDeniedException.class, () -> 
                securityUtils.assertInstitutionAccess(iitSuperAdmin, 102L, "National Institute of Tech (NIT)"));
    }

    @Test
    @DisplayName("IIT Trainer can access IIT resources but strictly rejected from NIT")
    void testTrainerIsolation() {
        assertTrue(securityUtils.isAllowedInstitution(iitTrainer, 101L, "Indian Institute of Technology (IIT)"));
        assertFalse(securityUtils.isAllowedInstitution(iitTrainer, 102L, "National Institute of Tech (NIT)"));

        assertDoesNotThrow(() -> securityUtils.assertInstitutionAccess(iitTrainer, 101L, "Indian Institute of Technology (IIT)"));
        assertThrows(AccessDeniedException.class, () -> 
                securityUtils.assertInstitutionAccess(iitTrainer, 102L, "National Institute of Tech (NIT)"));
    }

    @Test
    @DisplayName("IIT Student can access IIT resources but strictly rejected from NIT")
    void testStudentIsolation() {
        assertTrue(securityUtils.isAllowedInstitution(iitStudent, 101L, "Indian Institute of Technology (IIT)"));
        assertFalse(securityUtils.isAllowedInstitution(iitStudent, 102L, "National Institute of Tech (NIT)"));

        assertDoesNotThrow(() -> securityUtils.assertInstitutionAccess(iitStudent, 101L, "Indian Institute of Technology (IIT)"));
        assertThrows(AccessDeniedException.class, () -> 
                securityUtils.assertInstitutionAccess(iitStudent, 102L, "National Institute of Tech (NIT)"));
    }

    @Test
    @DisplayName("Global study materials are accessible to students and trainers across all institutions")
    void testGlobalStudyMaterialsAccess() {
        ResourceItem globalResource = ResourceItem.builder()
                .id(1L)
                .title("Vector Embeddings & Semantic Search Handbook")
                .visibilityScope("GLOBAL")
                .build();

        ResourceItem bothResource = ResourceItem.builder()
                .id(2L)
                .title("Distributed Systems Core Concepts")
                .visibilityScope("BOTH")
                .build();

        // IIT student & trainer can access global study materials
        assertTrue(securityUtils.canAccessResource(iitStudent, globalResource, 101L, "Indian Institute of Technology (IIT)"));
        assertTrue(securityUtils.canAccessResource(iitTrainer, globalResource, 101L, "Indian Institute of Technology (IIT)"));

        // NIT student & trainer can access global study materials even if hosted in IIT course
        assertTrue(securityUtils.canAccessResource(nitStudent, globalResource, 101L, "Indian Institute of Technology (IIT)"));
        assertTrue(securityUtils.canAccessResource(nitTrainer, globalResource, 101L, "Indian Institute of Technology (IIT)"));

        // BOTH visibility scope also accessible across institutions
        assertTrue(securityUtils.canAccessResource(nitStudent, bothResource, 101L, "Indian Institute of Technology (IIT)"));
    }

    @Test
    @DisplayName("Institution-specific study materials are strictly hidden and blocked from other institutions")
    void testInstitutionStudyMaterialsIsolation() {
        ResourceItem iitHandout = ResourceItem.builder()
                .id(3L)
                .title("IIT Advanced Machine Learning & Deep Neural Handout")
                .visibilityScope("INSTITUTION")
                .build();

        // IIT Student & Trainer can access IIT handout
        assertTrue(securityUtils.canAccessResource(iitStudent, iitHandout, 101L, "Indian Institute of Technology (IIT)"));
        assertTrue(securityUtils.canAccessResource(iitTrainer, iitHandout, 101L, "Indian Institute of Technology (IIT)"));

        // NIT Student & Trainer CANNOT access IIT handout
        assertFalse(securityUtils.canAccessResource(nitStudent, iitHandout, 101L, "Indian Institute of Technology (IIT)"));
        assertFalse(securityUtils.canAccessResource(nitTrainer, iitHandout, 101L, "Indian Institute of Technology (IIT)"));

        // Boss Admin can access any handout
        assertTrue(securityUtils.canAccessResource(bossAdmin, iitHandout, 101L, "Indian Institute of Technology (IIT)"));
    }
}
