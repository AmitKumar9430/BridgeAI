package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.OfficerInstitutionMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;

@Repository
public interface OfficerInstitutionRepository extends JpaRepository<OfficerInstitutionMapping, Long> {

    List<OfficerInstitutionMapping> findByOfficerId(Long officerId);

    List<OfficerInstitutionMapping> findByInstitutionId(Long institutionId);

    List<OfficerInstitutionMapping> findByOfficerIdIn(Collection<Long> officerIds);

    List<OfficerInstitutionMapping> findByInstitutionIdIn(Collection<Long> institutionIds);

    boolean existsByOfficerIdAndInstitutionId(Long officerId, Long institutionId);

    @Modifying
    @Transactional
    @Query("DELETE FROM OfficerInstitutionMapping m WHERE m.officerId = :officerId")
    void deleteByOfficerId(@Param("officerId") Long officerId);

    @Modifying
    @Transactional
    @Query("DELETE FROM OfficerInstitutionMapping m WHERE m.officerId = :officerId AND m.institutionId = :institutionId")
    void deleteByOfficerIdAndInstitutionId(@Param("officerId") Long officerId, @Param("institutionId") Long institutionId);
}
