package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.ProjectTeam;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectTeamRepository extends JpaRepository<ProjectTeam, Long> {
    List<ProjectTeam> findByTopicId(Long topicId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM ProjectTeam t WHERE t.id = :id")
    Optional<ProjectTeam> findByIdForUpdate(@Param("id") Long id);
}
