package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.ProjectInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectInviteRepository extends JpaRepository<ProjectInvite, Long> {
    List<ProjectInvite> findByRecipientIdAndStatus(Long recipientId, String status);
    List<ProjectInvite> findByRecipientId(Long recipientId);
    List<ProjectInvite> findByTeamId(Long teamId);
    List<ProjectInvite> findByTeamIdAndStatus(Long teamId, String status);
    Optional<ProjectInvite> findByTeamIdAndRecipientIdAndStatus(Long teamId, Long recipientId, String status);
    List<ProjectInvite> findByRecipientIdAndTopicIdAndStatus(Long recipientId, Long topicId, String status);
    List<ProjectInvite> findBySenderIdAndStatus(Long senderId, String status);
}
