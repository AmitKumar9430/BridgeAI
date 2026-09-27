package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.OfficerInstitutionMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface OfficerInstitutionRepository extends JpaRepository<OfficerInstitutionMapping, Long> {

    List<OfficerInstitutionMapping> findByOfficerId(Long officerId);

    List<OfficerInstitutionMapping> findByInstitutionId(Long institutionId);

    List<OfficerInstitutionMapping> findByOfficerIdIn(Collection<Long> officerIds);

    List<OfficerInstitutionMapping> findByInstitutionIdIn(Collection<Long> institutionIds);

    boolean existsByOfficerIdAndInstitutionId(Long officerId, Long institutionId);

    void deleteByOfficerId(Long officerId);

    void deleteByOfficerIdAndInstitutionId(Long officerId, Long institutionId);
}
