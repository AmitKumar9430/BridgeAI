package com.bridgeai.portal.security;

import com.bridgeai.portal.model.ResourceItem;
import com.bridgeai.portal.model.Role;
import com.bridgeai.portal.model.User;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

@Component
public class InstitutionSecurityUtils {

    /**
     * Verifies if the current user is permitted to view or interact with a resource belonging to targetInstId / targetInstName.
     * Boss Admin has global access across all institutions.
     * Vigilance Officers have cross-institution supervisory oversight as needed.
     * Super Admins, Trainers, and Students are strictly restricted to their own institution.
     */
    public boolean isAllowedInstitution(User user, Long targetInstId, String targetInstName) {
        if (user == null) {
            return false;
        }
        if (user.getRole() == Role.ROLE_BOSS_ADMIN || user.getRole() == Role.ROLE_VIGILANCE_OFFICER) {
            return true;
        }

        // If target resource is unassigned to any institution (e.g. global practice), allow access
        if (targetInstId == null && (targetInstName == null || targetInstName.isBlank())) {
            return true;
        }

        // Check by institution ID
        if (user.getInstitutionId() != null && targetInstId != null) {
            return user.getInstitutionId().equals(targetInstId);
        }

        // Fallback check by institution name
        if (user.getInstitutionName() != null && targetInstName != null && !targetInstName.isBlank()) {
            return user.getInstitutionName().trim().equalsIgnoreCase(targetInstName.trim());
        }

        return false;
    }

    /**
     * Asserts institution boundary; throws 403 AccessDeniedException if user does not belong to the target institution.
     */
    public void assertInstitutionAccess(User user, Long targetInstId, String targetInstName) {
        if (!isAllowedInstitution(user, targetInstId, targetInstName)) {
            throw new AccessDeniedException("Access Denied: You do not have permission to view, edit, or delete data belonging to another institution.");
        }
    }

    /**
     * Special access check for study materials and coursework resources:
     * - Study materials with visibilityScope = 'GLOBAL' or 'BOTH' are accessible across all institutions to all students & trainers.
     * - Study materials with visibilityScope = 'INSTITUTION' are accessible strictly to students/trainers belonging to that institution.
     */
    public boolean canAccessResource(User user, ResourceItem resource) {
        return canAccessResource(user, resource, null, null);
    }

    public boolean canAccessResource(User user, ResourceItem resource, Long courseInstId, String courseInstName) {
        if (resource == null) {
            return false;
        }

        String scope = resource.getVisibilityScope();
        // Global and Both scoped study materials are accessible to everyone across all institutions
        if (scope == null || "GLOBAL".equalsIgnoreCase(scope) || "BOTH".equalsIgnoreCase(scope)) {
            return true;
        }

        if (user == null) {
            return false;
        }
        if (user.getRole() == Role.ROLE_BOSS_ADMIN) {
            return true;
        }

        Long targetId = resource.getInstitutionId() != null ? resource.getInstitutionId() : courseInstId;
        String targetName = resource.getInstitutionName() != null ? resource.getInstitutionName() : courseInstName;
        return isAllowedInstitution(user, targetId, targetName);
    }
}
