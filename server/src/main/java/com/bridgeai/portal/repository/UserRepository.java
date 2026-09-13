package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.Role;
import com.bridgeai.portal.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByStaffId(String staffId);
    boolean existsByStaffId(String staffId);
    Optional<User> findByEmailIgnoreCaseOrStaffIdIgnoreCase(String email, String staffId);
    List<User> findByRole(Role role);
    List<User> findByRoleAndInstitutionName(Role role, String institutionName);
    List<User> findByRoleAndInstitutionId(Role role, Long institutionId);
    List<User> findByInstitutionName(String institutionName);
    List<User> findByInstitutionId(Long institutionId);
    Optional<User> findFirstByRoleAndInstitutionName(Role role, String institutionName);
    long countByInstitutionId(Long institutionId);
    long countByInstitutionName(String institutionName);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT u.institutionName FROM User u WHERE u.institutionName IS NOT NULL AND u.institutionName != ''")
    List<String> findDistinctInstitutions();
}
