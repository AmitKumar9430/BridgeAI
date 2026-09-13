package com.bridgeai.portal.service;

import com.bridgeai.portal.dto.ProjectDtos.*;
import com.bridgeai.portal.model.*;
import com.bridgeai.portal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectWorkRepository projectRepository;
    private final ProjectSelectionRepository selectionRepository;
    private final ProjectTeamRepository teamRepository;
    private final ProjectTeamMemberRepository memberRepository;
    private final ProjectInviteRepository inviteRepository;
    private final UserRepository userRepository;
    private final StudentNotificationRepository notificationRepository;

    public List<ProjectWork> getAllProjects() {
        return projectRepository.findAll();
    }

    public List<ProjectWork> getAllProjects(User user) {
        if (user == null || user.getRole() == Role.ROLE_BOSS_ADMIN) {
            return projectRepository.findAll();
        }
        if (user.getInstitutionId() != null) {
            return projectRepository.findByInstitutionId(user.getInstitutionId());
        }
        if (user.getInstitutionName() != null && !user.getInstitutionName().isBlank()) {
            return projectRepository.findByInstitutionNameIgnoreCase(user.getInstitutionName());
        }
        return projectRepository.findAll();
    }

    public List<ProjectWork> getAvailableTopics() {
        return projectRepository.findByAvailableForSelectionTrue();
    }

    public List<ProjectWork> getAvailableTopics(User user) {
        if (user == null || user.getRole() == Role.ROLE_BOSS_ADMIN) {
            return projectRepository.findByAvailableForSelectionTrue();
        }
        if (user.getInstitutionId() != null) {
            return projectRepository.findByInstitutionIdAndAvailableForSelectionTrue(user.getInstitutionId());
        }
        if (user.getInstitutionName() != null && !user.getInstitutionName().isBlank()) {
            return projectRepository.findByInstitutionNameIgnoreCaseAndAvailableForSelectionTrue(user.getInstitutionName());
        }
        return projectRepository.findByAvailableForSelectionTrue();
    }

    public List<ProjectWork> getProjectsByStudent(Long studentId) {
        return projectRepository.findByStudentId(studentId);
    }

    public List<ProjectWork> getProjectsByTrainer(Long trainerId) {
        return projectRepository.findByTrainerId(trainerId);
    }

    @Transactional
    public ProjectWork createProjectTopic(CreateProjectRequest req, Long trainerId, String trainerName, String institutionName, Long institutionId) {
        LocalDate deadlineDate = req.getDeadline() != null ? req.getDeadline().toLocalDate() : LocalDate.now().plusMonths(1);
        int minSize = (req.getMinTeamSize() != null && req.getMinTeamSize() > 0) ? req.getMinTeamSize() : 2;
        int maxSize = (req.getMaxTeamSize() != null && req.getMaxTeamSize() >= minSize) ? req.getMaxTeamSize() : Math.max(minSize, 4);

        ProjectWork project = ProjectWork.builder()
                .courseId(req.getCourseId() != null ? req.getCourseId() : 1L)
                .trainerId(trainerId)
                .trainerName(trainerName)
                .institutionName(institutionName)
                .institutionId(institutionId)
                .subjectName(req.getSubjectName() != null ? req.getSubjectName() : "Computer Science & AI")
                .title(req.getTitle())
                .description(req.getDescription())
                .requirements(req.getRequirements() != null ? req.getRequirements() : req.getDescription())
                .deadline(deadlineDate)
                .minTeamSize(minSize)
                .maxTeamSize(maxSize)
                .availableForSelection(true)
                .status("AVAILABLE")
                .createdAt(LocalDateTime.now())
                .build();
        return projectRepository.save(project);
    }

    @Transactional
    public ProjectSelection selectTopic(Long topicId, Long studentId, String studentName, String studentEmail, String instName) {
        ProjectWork topic = projectRepository.findById(topicId)
                .orElseThrow(() -> new IllegalArgumentException("Project Topic not found: " + topicId));

        User student = userRepository.findById(studentId).orElse(null);
        Long resolvedInstId = student != null ? student.getInstitutionId() : null;
        String resolvedInstName = (student != null && student.getInstitutionName() != null) ? student.getInstitutionName() : instName;

        // Verify that student belongs to the topic's institution (if topic is institution-specific)
        if (topic.getInstitutionId() != null && resolvedInstId != null && !topic.getInstitutionId().equals(resolvedInstId)) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied: You cannot select a project from another institution.");
        } else if (topic.getInstitutionName() != null && resolvedInstName != null &&
                !topic.getInstitutionName().equalsIgnoreCase(resolvedInstName)) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied: You cannot select a project from another institution.");
        }

        // 1. Record topic selection idempotently
        ProjectSelection selection = selectionRepository.findByTopicIdAndStudentId(topicId, studentId)
                .orElse(null);

        if (selection == null) {
            selection = ProjectSelection.builder()
                    .topicId(topicId)
                    .studentId(studentId)
                    .studentName(studentName)
                    .studentEmail(studentEmail)
                    .institutionId(resolvedInstId)
                    .institutionName(resolvedInstName != null ? resolvedInstName : "Indian Institute of Technology (IIT)")
                    .selectedAt(LocalDateTime.now())
                    .build();
            selection = selectionRepository.save(selection);
        }

        // 2. Automatically create initial solo team container if student is not yet in any team for this topic
        Optional<ProjectTeamMember> existingMembership = memberRepository.findByTopicIdAndStudentId(topicId, studentId);
        if (existingMembership.isEmpty()) {
            String initialTeamName = (studentName != null && !studentName.isBlank() ? studentName : "Student") + "'s Team";
            ProjectTeam initialTeam = ProjectTeam.builder()
                    .topicId(topicId)
                    .teamName(initialTeamName)
                    .leaderId(studentId)
                    .leaderName(studentName)
                    .institutionId(resolvedInstId)
                    .institutionName(resolvedInstName != null ? resolvedInstName : "Indian Institute of Technology (IIT)")
                    .status("FORMING")
                    .createdAt(LocalDateTime.now())
                    .build();
            initialTeam = teamRepository.save(initialTeam);

            ProjectTeamMember member = ProjectTeamMember.builder()
                    .teamId(initialTeam.getId())
                    .topicId(topicId)
                    .studentId(studentId)
                    .studentName(studentName)
                    .studentEmail(studentEmail)
                    .role("LEADER")
                    .joinedAt(LocalDateTime.now())
                    .build();
            memberRepository.save(member);
        }

        return selection;
    }

    public List<StudentPeerDto> getEligiblePeers(Long topicId, Long currentStudentId) {
        ProjectWork topic = projectRepository.findById(topicId).orElse(null);
        int effectiveMaxSize = (topic != null && topic.getMaxTeamSize() > 0) ? topic.getMaxTeamSize() : 4;

        User currentStudent = userRepository.findById(currentStudentId).orElse(null);
        Long myInstId = currentStudent != null ? currentStudent.getInstitutionId() : null;
        String myInstName = currentStudent != null ? currentStudent.getInstitutionName() : null;

        List<ProjectSelection> selections = selectionRepository.findByTopicId(topicId);
        List<StudentPeerDto> peers = new ArrayList<>();

        Optional<ProjectTeamMember> currentMemberOpt = memberRepository.findByTopicIdAndStudentId(topicId, currentStudentId);
        Long currentTeamId = currentMemberOpt.map(ProjectTeamMember::getTeamId).orElse(null);

        Set<Long> myTeammateIds = new HashSet<>();
        if (currentTeamId != null) {
            List<ProjectTeamMember> myTeamMembers = memberRepository.findByTeamId(currentTeamId);
            for (ProjectTeamMember m : myTeamMembers) {
                myTeammateIds.add(m.getStudentId());
            }
        }

        for (ProjectSelection sel : selections) {
            if (sel.getStudentId().equals(currentStudentId)) {
                continue;
            }

            // Enforce multi-tenant isolation: peer must belong to the same institution
            if (myInstId != null && sel.getInstitutionId() != null && !myInstId.equals(sel.getInstitutionId())) {
                continue;
            } else if (myInstName != null && sel.getInstitutionName() != null && !myInstName.equalsIgnoreCase(sel.getInstitutionName())) {
                continue;
            }

            if (myTeammateIds.contains(sel.getStudentId())) {
                continue; // Do not list current teammates as peers to invite
            }

            Optional<ProjectTeamMember> peerMemberOpt = memberRepository.findByTopicIdAndStudentId(topicId, sel.getStudentId());
            boolean hasTeam = peerMemberOpt.isPresent();
            Long peerTeamId = null;
            String peerTeamName = null;
            int peerMemberCount = 0;
            boolean isCommittedMultiMember = false;
            boolean teamHasSpace = false;

            if (hasTeam) {
                peerTeamId = peerMemberOpt.get().getTeamId();
                ProjectTeam peerTeam = teamRepository.findById(peerTeamId).orElse(null);
                if (peerTeam != null) {
                    peerTeamName = peerTeam.getTeamName();
                    long peerCount = memberRepository.countByTeamId(peerTeamId);
                    peerMemberCount = (int) peerCount;
                    if (peerMemberCount > 1) {
                        isCommittedMultiMember = true;
                    }
                    if (peerMemberCount < effectiveMaxSize && "FORMING".equalsIgnoreCase(peerTeam.getStatus())) {
                        teamHasSpace = true;
                    }
                }
            }

            boolean alreadyInvited = false;
            if (currentTeamId != null) {
                alreadyInvited = inviteRepository.findByTeamIdAndRecipientIdAndStatus(currentTeamId, sel.getStudentId(), "PENDING").isPresent();
            }

            peers.add(StudentPeerDto.builder()
                    .studentId(sel.getStudentId())
                    .studentName(sel.getStudentName())
                    .studentEmail(sel.getStudentEmail())
                    .hasTeam(hasTeam)
                    .teamId(peerTeamId)
                    .teamName(peerTeamName)
                    .teamMemberCount(peerMemberCount)
                    .teamCapacity(effectiveMaxSize)
                    .teamHasSpace(teamHasSpace)
                    .alreadyInvited(alreadyInvited)
                    .isCommittedMultiMember(isCommittedMultiMember)
                    .isMyTeammate(false)
                    .build());
        }

        return peers;
    }

    @Transactional
    public ProjectTeam createOrRenameTeam(Long topicId, String teamName, Long studentId, String studentName, String studentEmail) {
        String cleanName = teamName != null ? teamName.trim() : "Team";
        Optional<ProjectTeamMember> memberOpt = memberRepository.findByTopicIdAndStudentId(topicId, studentId);
        if (memberOpt.isPresent()) {
            ProjectTeamMember member = memberOpt.get();
            ProjectTeam team = teamRepository.findById(member.getTeamId())
                    .orElseThrow(() -> new IllegalStateException("Team not found for member"));

            if ("DISSOLVED".equalsIgnoreCase(team.getStatus())) {
                throw new IllegalStateException("Cannot rename a dissolved team.");
            }

            if ("LEADER".equalsIgnoreCase(member.getRole())) {
                team.setTeamName(cleanName);
                ProjectTeam savedTeam = teamRepository.save(team);

                // Update team name in any pending invites
                List<ProjectInvite> pendingInvites = inviteRepository.findByTeamIdAndStatus(team.getId(), "PENDING");
                for (ProjectInvite inv : pendingInvites) {
                    inv.setTeamName(cleanName);
                    inviteRepository.save(inv);
                }

                return savedTeam;
            } else {
                throw new IllegalStateException("Only the team leader can rename this team.");
            }
        } else {
            // Student has not selected topic or team yet, initialize selection first
            selectTopic(topicId, studentId, studentName, studentEmail, "Indian Institute of Technology (IIT)");
            Optional<ProjectTeamMember> newMemberOpt = memberRepository.findByTopicIdAndStudentId(topicId, studentId);
            if (newMemberOpt.isPresent()) {
                ProjectTeam team = teamRepository.findById(newMemberOpt.get().getTeamId()).orElseThrow();
                team.setTeamName(cleanName);
                return teamRepository.save(team);
            }
            throw new IllegalStateException("Failed to initialize team workspace.");
        }
    }

    @Transactional
    public ProjectInvite sendTeamInvite(Long teamId, Long recipientStudentId, Long senderId, String senderName) {
        ProjectTeam team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));

        // Team lifecycle check
        if ("SUBMITTED".equalsIgnoreCase(team.getStatus()) || "EVALUATED".equalsIgnoreCase(team.getStatus()) || "DISSOLVED".equalsIgnoreCase(team.getStatus())) {
            throw new IllegalStateException("Cannot send invitations for a team that is " + team.getStatus());
        }

        ProjectWork topic = projectRepository.findById(team.getTopicId())
                .orElseThrow(() -> new IllegalArgumentException("Topic not found: " + team.getTopicId()));

        // Team membership check: only an active member of this team can send invitations
        Optional<ProjectTeamMember> senderMemberOpt = memberRepository.findByTopicIdAndStudentId(team.getTopicId(), senderId);
        if (senderMemberOpt.isEmpty() || !senderMemberOpt.get().getTeamId().equals(teamId)) {
            throw new SecurityException("Unauthorized: You must be an active member of this team to send invitations.");
        }

        // Team capacity check
        List<ProjectTeamMember> currentMembers = memberRepository.findByTeamId(teamId);
        int effectiveMaxSize = topic.getMaxTeamSize() > 0 ? topic.getMaxTeamSize() : 4;
        if (currentMembers.size() >= effectiveMaxSize) {
            throw new IllegalStateException("Cannot send invite: Team has reached its maximum size of " + effectiveMaxSize + " members.");
        }

        if (recipientStudentId.equals(senderId)) {
            throw new IllegalArgumentException("You cannot invite yourself to your own team.");
        }

        // Check if recipient has selected this project topic
        Optional<ProjectSelection> recipientSel = selectionRepository.findByTopicIdAndStudentId(team.getTopicId(), recipientStudentId);
        if (recipientSel.isEmpty()) {
            throw new IllegalArgumentException("Cannot invite student: They have not selected this project topic yet.");
        }

        // Check if recipient is already in this team
        boolean alreadyMember = currentMembers.stream().anyMatch(m -> m.getStudentId().equals(recipientStudentId));
        if (alreadyMember) {
            throw new IllegalArgumentException("This student is already a member of your team.");
        }

        // Check if recipient is already part of another multi-member team
        Optional<ProjectTeamMember> recipientMemberOpt = memberRepository.findByTopicIdAndStudentId(team.getTopicId(), recipientStudentId);
        if (recipientMemberOpt.isPresent()) {
            long recipientTeamCount = memberRepository.countByTeamId(recipientMemberOpt.get().getTeamId());
            if (recipientTeamCount > 1) {
                throw new IllegalStateException("Cannot invite student: They are already part of another active multi-member team.");
            }
        }

        // Check for existing pending invite (idempotency check)
        Optional<ProjectInvite> existingInvite = inviteRepository.findByTeamIdAndRecipientIdAndStatus(teamId, recipientStudentId, "PENDING");
        if (existingInvite.isPresent()) {
            ProjectInvite inv = existingInvite.get();
            if (inv.getExpiresAt() != null && inv.getExpiresAt().isBefore(LocalDateTime.now())) {
                inv.setStatus("EXPIRED");
                inv.setRespondedAt(LocalDateTime.now());
                inviteRepository.save(inv);
            } else {
                return inv;
            }
        }

        User recipientUser = userRepository.findById(recipientStudentId)
                .orElseThrow(() -> new IllegalArgumentException("Recipient student not found: " + recipientStudentId));
        User senderUser = userRepository.findById(senderId).orElse(null);

        // Enforce multi-tenant isolation: sender and recipient must belong to the same institution
        if (senderUser != null) {
            if (senderUser.getInstitutionId() != null && recipientUser.getInstitutionId() != null &&
                    !senderUser.getInstitutionId().equals(recipientUser.getInstitutionId())) {
                throw new org.springframework.security.access.AccessDeniedException("Cross-institution team invitation is strictly prohibited.");
            } else if (senderUser.getInstitutionName() != null && recipientUser.getInstitutionName() != null &&
                    !senderUser.getInstitutionName().equalsIgnoreCase(recipientUser.getInstitutionName())) {
                throw new org.springframework.security.access.AccessDeniedException("Cross-institution team invitation is strictly prohibited.");
            }
        }

        ProjectInvite invite = ProjectInvite.builder()
                .teamId(teamId)
                .topicId(team.getTopicId())
                .teamName(team.getTeamName())
                .senderId(senderId)
                .senderName(senderName)
                .recipientId(recipientStudentId)
                .recipientName(recipientUser.getFullName())
                .recipientEmail(recipientUser.getEmail())
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();

        ProjectInvite saved = inviteRepository.save(invite);

        try {
            StudentNotification notif = StudentNotification.builder()
                    .userId(recipientStudentId)
                    .title("New Project Team Invitation")
                    .message(senderName + " invited you to join team \"" + team.getTeamName() + "\" for project \"" + topic.getTitle() + "\".")
                    .type("PROJECT_INVITE")
                    .referenceId(saved.getId())
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notif);
        } catch (Exception ignored) {}

        return saved;
    }

    @Transactional
    public ProjectInvite cancelTeamInvite(Long inviteId, Long studentId) {
        ProjectInvite invite = inviteRepository.findById(inviteId)
                .orElseThrow(() -> new IllegalArgumentException("Invite not found: " + inviteId));

        ProjectTeam team = teamRepository.findById(invite.getTeamId())
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + invite.getTeamId()));

        boolean isLeader = team.getLeaderId().equals(studentId);
        boolean isSender = invite.getSenderId().equals(studentId);
        if (!isLeader && !isSender) {
            throw new SecurityException("Unauthorized: Only the team leader can cancel this invitation.");
        }

        if (!"PENDING".equalsIgnoreCase(invite.getStatus())) {
            throw new IllegalStateException("Cannot cancel invite: Invite is already " + invite.getStatus());
        }

        invite.setStatus("CANCELLED");
        invite.setRespondedAt(LocalDateTime.now());
        return inviteRepository.save(invite);
    }

    public List<ProjectInvite> getPendingInvitesForStudent(Long studentId) {
        List<ProjectInvite> list = inviteRepository.findByRecipientIdAndStatus(studentId, "PENDING");
        LocalDateTime now = LocalDateTime.now();
        List<ProjectInvite> active = new ArrayList<>();
        for (ProjectInvite inv : list) {
            if (inv.getExpiresAt() != null && inv.getExpiresAt().isBefore(now)) {
                inv.setStatus("EXPIRED");
                inv.setRespondedAt(now);
                inviteRepository.save(inv);
            } else {
                active.add(inv);
            }
        }
        return active;
    }

    @Transactional
    public ProjectTeam respondToInvite(Long inviteId, boolean accept, Long studentId, String studentName, String studentEmail) {
        ProjectInvite invite = inviteRepository.findById(inviteId)
                .orElseThrow(() -> new IllegalArgumentException("Invite not found: " + inviteId));

        if (!invite.getRecipientId().equals(studentId)) {
            throw new SecurityException("Unauthorized: This invite was not sent to you.");
        }

        if (!"PENDING".equalsIgnoreCase(invite.getStatus())) {
            throw new IllegalStateException("Invite is no longer pending (" + invite.getStatus() + ").");
        }

        if (invite.getExpiresAt() != null && invite.getExpiresAt().isBefore(LocalDateTime.now())) {
            invite.setStatus("EXPIRED");
            invite.setRespondedAt(LocalDateTime.now());
            inviteRepository.save(invite);
            throw new IllegalStateException("This invitation has expired.");
        }

        if (!accept) {
            invite.setStatus("DECLINED");
            invite.setRespondedAt(LocalDateTime.now());
            inviteRepository.save(invite);
            try {
                StudentNotification notif = StudentNotification.builder()
                        .userId(invite.getSenderId())
                        .title("Project Invitation Declined")
                        .message(studentName + " declined your invitation to join team \"" + invite.getTeamName() + "\".")
                        .type("INVITE_DECLINED")
                        .referenceId(invite.getId())
                        .isRead(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                notificationRepository.save(notif);
            } catch (Exception ignored) {}
            return null;
        }

        // Concurrency-safe: Acquire pessimistic lock on target team
        ProjectTeam team = teamRepository.findByIdForUpdate(invite.getTeamId())
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + invite.getTeamId()));

        if ("SUBMITTED".equalsIgnoreCase(team.getStatus()) || "EVALUATED".equalsIgnoreCase(team.getStatus()) || "DISSOLVED".equalsIgnoreCase(team.getStatus())) {
            throw new IllegalStateException("Cannot join team: Team is " + team.getStatus());
        }

        ProjectWork topic = projectRepository.findById(team.getTopicId())
                .orElseThrow(() -> new IllegalArgumentException("Topic not found: " + team.getTopicId()));

        List<ProjectTeamMember> currentMembers = memberRepository.findByTeamId(team.getId());
        int effectiveMaxSize = topic.getMaxTeamSize() > 0 ? topic.getMaxTeamSize() : 4;
        if (currentMembers.size() >= effectiveMaxSize) {
            invite.setStatus("EXPIRED");
            invite.setRespondedAt(LocalDateTime.now());
            inviteRepository.save(invite);
            throw new IllegalStateException("Sorry, this team is already full (maximum " + effectiveMaxSize + " members).");
        }

        // Membership transfer and placeholder team dissolution
        Optional<ProjectTeamMember> existingMemberOpt = memberRepository.findByTopicIdAndStudentId(topic.getId(), studentId);
        if (existingMemberOpt.isPresent()) {
            ProjectTeamMember existingMember = existingMemberOpt.get();
            if (existingMember.getTeamId().equals(team.getId())) {
                invite.setStatus("ACCEPTED");
                invite.setRespondedAt(LocalDateTime.now());
                inviteRepository.save(invite);
                return team;
            }

            List<ProjectTeamMember> oldTeamMembers = memberRepository.findByTeamId(existingMember.getTeamId());
            if (oldTeamMembers.size() > 1) {
                throw new IllegalStateException("You are already part of an active multi-member team for this project topic. Please leave that team first.");
            }

            Long oldTeamId = existingMember.getTeamId();

            // Cancel any pending invites sent from old solo team
            List<ProjectInvite> oldTeamInvites = inviteRepository.findByTeamId(oldTeamId);
            for (ProjectInvite oldInv : oldTeamInvites) {
                if ("PENDING".equalsIgnoreCase(oldInv.getStatus())) {
                    oldInv.setStatus("CANCELLED");
                    oldInv.setRespondedAt(LocalDateTime.now());
                    inviteRepository.save(oldInv);
                }
            }

            // Transfer member to target team as MEMBER
            existingMember.setTeamId(team.getId());
            existingMember.setRole("MEMBER");
            existingMember.setJoinedAt(LocalDateTime.now());
            memberRepository.save(existingMember);

            // Dissolve/delete old solo team only AFTER student is safely transferred
            teamRepository.deleteById(oldTeamId);
        } else {
            ProjectTeamMember newMember = ProjectTeamMember.builder()
                    .teamId(team.getId())
                    .topicId(topic.getId())
                    .studentId(studentId)
                    .studentName(studentName)
                    .studentEmail(studentEmail)
                    .role("MEMBER")
                    .joinedAt(LocalDateTime.now())
                    .build();
            memberRepository.save(newMember);

            if (selectionRepository.findByTopicIdAndStudentId(topic.getId(), studentId).isEmpty()) {
                selectionRepository.save(ProjectSelection.builder()
                        .topicId(topic.getId())
                        .studentId(studentId)
                        .studentName(studentName)
                        .studentEmail(studentEmail)
                        .institutionName("Indian Institute of Technology (IIT)")
                        .selectedAt(LocalDateTime.now())
                        .build());
            }
        }

        invite.setStatus("ACCEPTED");
        invite.setRespondedAt(LocalDateTime.now());
        inviteRepository.save(invite);

        // Invalidate conflicting pending invites for this student on this topic
        List<ProjectInvite> conflictingInvites = inviteRepository.findByRecipientIdAndTopicIdAndStatus(studentId, topic.getId(), "PENDING");
        for (ProjectInvite ci : conflictingInvites) {
            if (!ci.getId().equals(invite.getId())) {
                ci.setStatus("CANCELLED");
                ci.setRespondedAt(LocalDateTime.now());
                inviteRepository.save(ci);
            }
        }

        // If team reached capacity, auto-cancel remaining sent invites
        if (currentMembers.size() + 1 >= effectiveMaxSize) {
            List<ProjectInvite> pendingTeamInvites = inviteRepository.findByTeamIdAndStatus(team.getId(), "PENDING");
            for (ProjectInvite pti : pendingTeamInvites) {
                pti.setStatus("CANCELLED");
                pti.setRespondedAt(LocalDateTime.now());
                inviteRepository.save(pti);
            }
        }

        try {
            StudentNotification notif = StudentNotification.builder()
                    .userId(invite.getSenderId())
                    .title("Project Invitation Accepted")
                    .message(studentName + " accepted your invitation to join team \"" + team.getTeamName() + "\".")
                    .type("INVITE_ACCEPTED")
                    .referenceId(invite.getId())
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notif);
        } catch (Exception ignored) {}

        return team;
    }

    @Transactional
    public ProjectTeam joinTeam(Long teamId, Long studentId, String studentName, String studentEmail) {
        ProjectTeam team = teamRepository.findByIdForUpdate(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));

        User joiningUser = userRepository.findById(studentId).orElse(null);
        if (joiningUser != null) {
            if (team.getInstitutionId() != null && joiningUser.getInstitutionId() != null &&
                    !team.getInstitutionId().equals(joiningUser.getInstitutionId())) {
                throw new org.springframework.security.access.AccessDeniedException("Cross-institution team joining is strictly prohibited.");
            } else if (team.getInstitutionName() != null && joiningUser.getInstitutionName() != null &&
                    !team.getInstitutionName().equalsIgnoreCase(joiningUser.getInstitutionName())) {
                throw new org.springframework.security.access.AccessDeniedException("Cross-institution team joining is strictly prohibited.");
            }
        }

        if ("SUBMITTED".equalsIgnoreCase(team.getStatus()) || "EVALUATED".equalsIgnoreCase(team.getStatus()) || "DISSOLVED".equalsIgnoreCase(team.getStatus())) {
            throw new IllegalStateException("Cannot join team: Team is " + team.getStatus());
        }

        ProjectWork topic = projectRepository.findById(team.getTopicId())
                .orElseThrow(() -> new IllegalArgumentException("Topic not found: " + team.getTopicId()));

        List<ProjectTeamMember> currentMembers = memberRepository.findByTeamId(team.getId());
        int effectiveMaxSize = topic.getMaxTeamSize() > 0 ? topic.getMaxTeamSize() : 4;
        if (currentMembers.size() >= effectiveMaxSize) {
            throw new IllegalStateException("Sorry, this team is already full (maximum " + effectiveMaxSize + " members).");
        }

        // Check if user is already a member of this team
        boolean alreadyMember = currentMembers.stream().anyMatch(m -> m.getStudentId().equals(studentId));
        if (alreadyMember) {
            return team;
        }

        // Check user's current team membership for this topic
        Optional<ProjectTeamMember> existingMemberOpt = memberRepository.findByTopicIdAndStudentId(topic.getId(), studentId);
        if (existingMemberOpt.isPresent()) {
            ProjectTeamMember existingMember = existingMemberOpt.get();
            List<ProjectTeamMember> oldTeamMembers = memberRepository.findByTeamId(existingMember.getTeamId());
            if (oldTeamMembers.size() > 1) {
                throw new IllegalStateException("You are already part of an active multi-member team for this project topic. Please leave that team first.");
            }

            Long oldTeamId = existingMember.getTeamId();

            // Cancel any pending invites sent from old solo team
            List<ProjectInvite> oldTeamInvites = inviteRepository.findByTeamId(oldTeamId);
            for (ProjectInvite oldInv : oldTeamInvites) {
                if ("PENDING".equalsIgnoreCase(oldInv.getStatus())) {
                    oldInv.setStatus("CANCELLED");
                    oldInv.setRespondedAt(LocalDateTime.now());
                    inviteRepository.save(oldInv);
                }
            }

            // Transfer member to target team as MEMBER
            existingMember.setTeamId(team.getId());
            existingMember.setRole("MEMBER");
            existingMember.setJoinedAt(LocalDateTime.now());
            memberRepository.save(existingMember);

            // Dissolve old solo team
            teamRepository.deleteById(oldTeamId);
        } else {
            // Ensure selection exists
            Optional<ProjectSelection> selOpt = selectionRepository.findByTopicIdAndStudentId(topic.getId(), studentId);
            if (selOpt.isEmpty()) {
                selectTopic(topic.getId(), studentId, studentName, studentEmail, "Indian Institute of Technology (IIT)");
            }

            ProjectTeamMember newMember = ProjectTeamMember.builder()
                    .teamId(team.getId())
                    .topicId(topic.getId())
                    .studentId(studentId)
                    .studentName(studentName)
                    .studentEmail(studentEmail)
                    .role("MEMBER")
                    .joinedAt(LocalDateTime.now())
                    .build();
            memberRepository.save(newMember);
        }

        // Cancel / accept any pending invites between this team and this student
        List<ProjectInvite> pendingInvites = inviteRepository.findByTeamIdAndRecipientIdAndStatus(team.getId(), studentId, "PENDING")
                .map(List::of).orElse(List.of());
        for (ProjectInvite inv : pendingInvites) {
            inv.setStatus("ACCEPTED");
            inv.setRespondedAt(LocalDateTime.now());
            inviteRepository.save(inv);
        }

        // Notify existing team members
        for (ProjectTeamMember m : currentMembers) {
            try {
                StudentNotification notif = StudentNotification.builder()
                        .userId(m.getStudentId())
                        .title("New Teammate Joined")
                        .message(studentName + " has joined your project team: " + team.getTeamName())
                        .type("PROJECT_INVITE")
                        .referenceId(team.getId())
                        .isRead(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                notificationRepository.save(notif);
            } catch (Exception ignored) {}
        }

        // Notify the joining student
        try {
            StudentNotification notif = StudentNotification.builder()
                    .userId(studentId)
                    .title("Joined Team Successfully")
                    .message("You have joined " + team.getTeamName() + " for project topic: " + topic.getTitle())
                    .type("PROJECT_INVITE")
                    .referenceId(team.getId())
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notif);
        } catch (Exception ignored) {}

        return team;
    }

    @Transactional
    public ProjectTeam leaveTeam(Long topicId, Long studentId) {
        ProjectTeamMember member = memberRepository.findByTopicIdAndStudentId(topicId, studentId)
                .orElseThrow(() -> new IllegalArgumentException("You are not part of any team for this topic."));

        Long teamId = member.getTeamId();
        ProjectTeam team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));

        if ("SUBMITTED".equalsIgnoreCase(team.getStatus()) || "EVALUATED".equalsIgnoreCase(team.getStatus())) {
            throw new IllegalStateException("Cannot leave a team that has already submitted deliverables.");
        }

        List<ProjectTeamMember> members = memberRepository.findByTeamId(teamId);
        if (members.size() <= 1) {
            return team;
        }

        if ("LEADER".equalsIgnoreCase(member.getRole())) {
            ProjectTeamMember nextLeader = members.stream()
                    .filter(m -> !m.getStudentId().equals(studentId))
                    .min(Comparator.comparing(ProjectTeamMember::getJoinedAt))
                    .orElseThrow(() -> new IllegalStateException("No eligible teammate to inherit leadership."));
            nextLeader.setRole("LEADER");
            memberRepository.save(nextLeader);

            team.setLeaderId(nextLeader.getStudentId());
            team.setLeaderName(nextLeader.getStudentName());
            teamRepository.save(team);
        }

        memberRepository.delete(member);

        String name = member.getStudentName() != null ? member.getStudentName() : "Student";
        ProjectTeam soloTeam = ProjectTeam.builder()
                .topicId(topicId)
                .teamName(name + "'s Team")
                .leaderId(studentId)
                .leaderName(name)
                .status("FORMING")
                .createdAt(LocalDateTime.now())
                .build();
        soloTeam = teamRepository.save(soloTeam);

        ProjectTeamMember soloMember = ProjectTeamMember.builder()
                .teamId(soloTeam.getId())
                .topicId(topicId)
                .studentId(studentId)
                .studentName(name)
                .studentEmail(member.getStudentEmail())
                .role("LEADER")
                .joinedAt(LocalDateTime.now())
                .build();
        memberRepository.save(soloMember);

        return soloTeam;
    }

    @Transactional
    public ProjectTeam submitTeamDeliverables(SubmitTeamDeliverablesRequest req, Long studentId, String studentName) {
        ProjectTeam team = teamRepository.findById(req.getTeamId())
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + req.getTeamId()));

        if ("DISSOLVED".equalsIgnoreCase(team.getStatus())) {
            throw new IllegalStateException("Cannot submit deliverables for a dissolved team.");
        }

        List<ProjectTeamMember> members = memberRepository.findByTeamId(team.getId());
        boolean isMember = members.stream().anyMatch(m -> m.getStudentId().equals(studentId));
        if (!isMember) {
            throw new SecurityException("Unauthorized: You must be a teammate of this team to upload project deliverables.");
        }

        if (req.getZipFileUrl() != null && !req.getZipFileUrl().isBlank()) {
            team.setZipFileUrl(req.getZipFileUrl());
        }
        if (req.getPptFileUrl() != null && !req.getPptFileUrl().isBlank()) {
            team.setPptFileUrl(req.getPptFileUrl());
        }
        if (req.getPdfReportUrl() != null && !req.getPdfReportUrl().isBlank()) {
            team.setPdfReportUrl(req.getPdfReportUrl());
        }
        if (req.getGithubRepoUrl() != null && !req.getGithubRepoUrl().isBlank()) {
            team.setGithubRepoUrl(req.getGithubRepoUrl());
        }
        if (req.getLiveDemoUrl() != null && !req.getLiveDemoUrl().isBlank()) {
            team.setLiveDemoUrl(req.getLiveDemoUrl());
        }
        if (req.getStudentComments() != null && !req.getStudentComments().isBlank()) {
            team.setStudentComments(req.getStudentComments());
        }

        team.setLastUpdatedByName(studentName);
        team.setLastUpdatedAt(LocalDateTime.now());
        team.setStatus("SUBMITTED");

        return teamRepository.save(team);
    }

    public TeamDetailsDto getMyTeamForTopic(Long topicId, Long studentId) {
        Optional<ProjectTeamMember> memberOpt = memberRepository.findByTopicIdAndStudentId(topicId, studentId);
        if (memberOpt.isEmpty()) {
            return null;
        }

        ProjectTeamMember member = memberOpt.get();
        ProjectTeam team = teamRepository.findById(member.getTeamId()).orElse(null);
        if (team == null) {
            return null;
        }

        ProjectWork topic = projectRepository.findById(topicId).orElse(null);
        List<ProjectTeamMember> members = memberRepository.findByTeamId(team.getId());
        List<ProjectInvite> allTeamInvites = inviteRepository.findByTeamIdAndStatus(team.getId(), "PENDING");

        return TeamDetailsDto.builder()
                .team(team)
                .topic(topic)
                .members(members)
                .pendingSentInvites(allTeamInvites)
                .isCurrentMember(true)
                .isLeader("LEADER".equalsIgnoreCase(member.getRole()))
                .build();
    }

    public List<TeamDetailsDto> getTeamsForTopic(Long topicId) {
        ProjectWork topic = projectRepository.findById(topicId).orElse(null);
        List<ProjectTeam> teams = teamRepository.findByTopicId(topicId);
        List<TeamDetailsDto> dtos = new ArrayList<>();

        for (ProjectTeam t : teams) {
            List<ProjectTeamMember> members = memberRepository.findByTeamId(t.getId());
            dtos.add(TeamDetailsDto.builder()
                    .team(t)
                    .topic(topic)
                    .members(members)
                    .pendingSentInvites(List.of())
                    .isCurrentMember(false)
                    .isLeader(false)
                    .build());
        }
        return dtos;
    

    }
    @Transactional
    public ProjectTeam gradeTeam(Long teamId, GradeTeamRequest req, Long trainerId) {
        ProjectTeam team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));

        team.setScore(req.getScore());
        team.setFeedback(req.getFeedback());
        team.setStatus(req.getStatus() != null ? req.getStatus() : "EVALUATED");

        return teamRepository.save(team);
    }

    // Backwards-compatible methods
    @Transactional
    public ProjectWork selectProject(Long projectId, Long studentId, String studentName) {
        selectTopic(projectId, studentId, studentName, "student@bridgeai.edu", "Main Institute");
        return projectRepository.findById(projectId).orElse(null);
    

    }
    @Transactional
    public ProjectWork submitDeliverables(SubmitProjectRequest req, Long studentId) {
        ProjectWork project = projectRepository.findById(req.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + req.getProjectId()));
        if (req.getZipFileUrl() != null) project.setZipFileUrl(req.getZipFileUrl());
        if (req.getPptFileUrl() != null) project.setPptFileUrl(req.getPptFileUrl());
        if (req.getPdfReportUrl() != null) project.setPdfReportUrl(req.getPdfReportUrl());
        if (req.getGithubRepoUrl() != null) project.setGithubRepoUrl(req.getGithubRepoUrl());
        if (req.getLiveDemoUrl() != null) project.setLiveDemoUrl(req.getLiveDemoUrl());
        project.setStatus("SUBMITTED");
        return projectRepository.save(project);
    

    }
    @Transactional
    public ProjectWork gradeProject(Long projectId, GradeProjectRequest req, Long trainerId) {
        ProjectWork project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));
        project.setScore(req.getScore());
        project.setFeedback(req.getFeedback());
        project.setStatus(req.getStatus() != null ? req.getStatus() : "EVALUATED");
        return projectRepository.save(project);
    }


    @Transactional
    public ProjectWork updateProjectTopic(Long topicId, CreateProjectRequest req) {
        ProjectWork project = projectRepository.findById(topicId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + topicId));
        if (req.getTitle() != null && !req.getTitle().isBlank()) {
            project.setTitle(req.getTitle().trim());
        }
        if (req.getDescription() != null) {
            project.setDescription(req.getDescription().trim());
        }
        if (req.getRequirements() != null) {
            project.setRequirements(req.getRequirements().trim());
        }
        if (req.getSubjectName() != null && !req.getSubjectName().isBlank()) {
            project.setSubjectName(req.getSubjectName().trim());
        }
        if (req.getDeadline() != null) {
            project.setDeadline(req.getDeadline().toLocalDate());
        }

        if (req.getMinTeamSize() != null && req.getMinTeamSize() > 0) {
            project.setMinTeamSize(req.getMinTeamSize());
        }
        if (req.getMaxTeamSize() != null && req.getMaxTeamSize() > 0) {
            project.setMaxTeamSize(req.getMaxTeamSize());
        }
        return projectRepository.save(project);
    

    }
    @Transactional
    public void deleteProjectTopic(Long topicId) {
        List<ProjectTeam> teams = teamRepository.findByTopicId(topicId);
        for (ProjectTeam t : teams) {
            inviteRepository.deleteAll(inviteRepository.findByTeamId(t.getId()));
            memberRepository.deleteAll(memberRepository.findByTeamId(t.getId()));
        }
        teamRepository.deleteAll(teams);
        selectionRepository.deleteAll(selectionRepository.findByTopicId(topicId));
        projectRepository.deleteById(topicId);
    }
}
