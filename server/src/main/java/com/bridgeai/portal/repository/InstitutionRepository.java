package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.Institution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InstitutionRepository extends JpaRepository<Institution, Long> {
    Optional<Institution> findByName(String name);
    Optional<Institution> findByNameIgnoreCase(String name);
    boolean existsByName(String name);
    Optional<Institution> findByCode(String code);
}
