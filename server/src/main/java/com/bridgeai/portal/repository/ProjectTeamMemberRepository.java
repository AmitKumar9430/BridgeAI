package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.ProjectTeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectTeamMemberRepository extends JpaRepository<ProjectTeamMember, Long> {
    List<ProjectTeamMember> findByTeamId(Long teamId);
    Optional<ProjectTeamMember> findByTopicIdAndStudentId(Long topicId, Long studentId);
    List<ProjectTeamMember> findByStudentId(Long studentId);
    long countByTeamId(Long teamId);
    void deleteByTeamId(Long teamId);
}
