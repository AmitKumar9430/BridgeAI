package com.bridgeai.portal.service;

import com.bridgeai.portal.dto.ProjectDtos.*;
import com.bridgeai.portal.model.*;
import com.bridgeai.portal.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectWorkRepository projectRepository;
    @Mock
    private ProjectSelectionRepository selectionRepository;
    @Mock
    private ProjectTeamRepository teamRepository;
    @Mock
    private ProjectTeamMemberRepository memberRepository;
    @Mock
    private ProjectInviteRepository inviteRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private StudentNotificationRepository notificationRepository;

    @InjectMocks
    private ProjectService projectService;

    private ProjectWork sampleTopic;
    private User leaderUser;
    private User peerUser;
    private ProjectTeam sampleTeam;
    private ProjectTeamMember leaderMember;

    @BeforeEach
    void setUp() {
        sampleTopic = ProjectWork.builder()
                .id(10L)
                .title("Distributed AI Systems")
                .description("Build microservices platform")
                .minTeamSize(2)
                .maxTeamSize(4)
                .status("AVAILABLE")
                .build();

        leaderUser = User.builder()
                .id(1L)
                .fullName("Rahul Verma")
                .email("rahul@bridgeai.edu")
                .institutionName("Indian Institute of Technology (IIT)")
                .build();

        peerUser = User.builder()
                .id(2L)
                .fullName("Priya Sharma")
                .email("priya@bridgeai.edu")
                .institutionName("Indian Institute of Technology (IIT)")
                .build();

        sampleTeam = ProjectTeam.builder()
                .id(100L)
                .topicId(10L)
                .teamName("Alpha Team")
                .leaderId(1L)
                .leaderName("Rahul Verma")
                .status("FORMING")
                .createdAt(LocalDateTime.now())
                .build();

        leaderMember = ProjectTeamMember.builder()
                .id(501L)
                .teamId(100L)
                .topicId(10L)
                .studentId(1L)
                .studentName("Rahul Verma")
                .studentEmail("rahul@bridgeai.edu")
                .role("LEADER")
                .joinedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Topic Selection creates solo placeholder team and leader membership idempotently")
    void testSelectTopic_CreatesSoloPlaceholderTeam() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(sampleTopic));
        when(selectionRepository.findByTopicIdAndStudentId(10L, 1L)).thenReturn(Optional.empty());
        when(selectionRepository.save(any(ProjectSelection.class))).thenAnswer(inv -> inv.getArgument(0));
        when(memberRepository.findByTopicIdAndStudentId(10L, 1L)).thenReturn(Optional.empty());

        ProjectTeam savedTeam = ProjectTeam.builder().id(999L).topicId(10L).teamName("Rahul Verma's Team").leaderId(1L).status("FORMING").build();
        when(teamRepository.save(any(ProjectTeam.class))).thenReturn(savedTeam);

        ProjectSelection selection = projectService.selectTopic(10L, 1L, "Rahul Verma", "rahul@bridgeai.edu", "IIT");

        assertNotNull(selection);
        verify(teamRepository, times(1)).save(argThat(t ->
                t.getLeaderId().equals(1L) && t.getTeamName().contains("Rahul Verma") && "FORMING".equals(t.getStatus())
        ));
        verify(memberRepository, times(1)).save(argThat(m ->
                m.getStudentId().equals(1L) && "LEADER".equals(m.getRole())
        ));
    }

    @Test
    @DisplayName("Topic Selection is idempotent when user already selected topic and has team")
    void testSelectTopic_IdempotentWhenAlreadySelected() {
        ProjectSelection existingSelection = ProjectSelection.builder().id(77L).topicId(10L).studentId(1L).build();
        when(projectRepository.findById(10L)).thenReturn(Optional.of(sampleTopic));
        when(selectionRepository.findByTopicIdAndStudentId(10L, 1L)).thenReturn(Optional.of(existingSelection));
        when(memberRepository.findByTopicIdAndStudentId(10L, 1L)).thenReturn(Optional.of(leaderMember));

        ProjectSelection result = projectService.selectTopic(10L, 1L, "Rahul Verma", "rahul@bridgeai.edu", "IIT");

        assertEquals(existingSelection, result);
        verify(teamRepository, never()).save(any());
        verify(memberRepository, never()).save(any());
    }

    @Test
    @DisplayName("Team Leader can rename team and updates pending invites")
    void testCreateOrRenameTeam_LeaderCanRename() {
        when(memberRepository.findByTopicIdAndStudentId(10L, 1L)).thenReturn(Optional.of(leaderMember));
        when(teamRepository.findById(100L)).thenReturn(Optional.of(sampleTeam));
        when(teamRepository.save(any(ProjectTeam.class))).thenAnswer(inv -> inv.getArgument(0));
        when(inviteRepository.findByTeamIdAndStatus(100L, "PENDING")).thenReturn(List.of());

        ProjectTeam renamed = projectService.createOrRenameTeam(10L, "Quantum Engineers", 1L, "Rahul Verma", "rahul@bridgeai.edu");

        assertEquals("Quantum Engineers", renamed.getTeamName());
        verify(teamRepository, times(1)).save(sampleTeam);
    }

    @Test
    @DisplayName("Non-leader cannot rename team")
    void testCreateOrRenameTeam_NonLeaderThrowsException() {
        ProjectTeamMember nonLeaderMember = ProjectTeamMember.builder()
                .id(502L).teamId(100L).topicId(10L).studentId(2L).role("MEMBER").build();
        when(memberRepository.findByTopicIdAndStudentId(10L, 2L)).thenReturn(Optional.of(nonLeaderMember));
        when(teamRepository.findById(100L)).thenReturn(Optional.of(sampleTeam));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                projectService.createOrRenameTeam(10L, "Quantum Hackers", 2L, "Priya Sharma", "priya@bridgeai.edu")
        );
        assertTrue(ex.getMessage().contains("Only the team leader can rename this team"));
    }

    @Test
    @DisplayName("Non-member cannot send team invites")
    void testSendTeamInvite_NonMemberCannotSend() {
        when(teamRepository.findById(100L)).thenReturn(Optional.of(sampleTeam));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(sampleTopic));

        // Caller student 99 is not a member of team 100
        when(memberRepository.findByTopicIdAndStudentId(10L, 99L)).thenReturn(Optional.empty());

        SecurityException ex = assertThrows(SecurityException.class, () ->
                projectService.sendTeamInvite(100L, 3L, 99L, "Stranger")
        );
        assertTrue(ex.getMessage().contains("You must be an active member of this team to send invitations"));
    }

    @Test
    @DisplayName("Active team member (even if role is MEMBER) can send team invite")
    void testSendTeamInvite_ActiveMemberCanSend() {
        when(teamRepository.findById(100L)).thenReturn(Optional.of(sampleTeam));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(sampleTopic));

        ProjectTeamMember regularMember = ProjectTeamMember.builder()
                .teamId(100L).topicId(10L).studentId(2L).role("MEMBER").build();
        when(memberRepository.findByTopicIdAndStudentId(10L, 2L)).thenReturn(Optional.of(regularMember));
        when(memberRepository.findByTeamId(100L)).thenReturn(List.of(regularMember));
        when(selectionRepository.findByTopicIdAndStudentId(10L, 3L)).thenReturn(Optional.of(
                ProjectSelection.builder().topicId(10L).studentId(3L).build()
        ));
        when(memberRepository.findByTopicIdAndStudentId(10L, 3L)).thenReturn(Optional.empty());
        when(inviteRepository.findByTeamIdAndRecipientIdAndStatus(100L, 3L, "PENDING")).thenReturn(Optional.empty());
        when(userRepository.findById(3L)).thenReturn(Optional.of(peerUser));

        ProjectInvite savedInvite = ProjectInvite.builder().id(99L).teamId(100L).topicId(10L).recipientId(3L).status("PENDING").build();
        when(inviteRepository.save(any(ProjectInvite.class))).thenReturn(savedInvite);

        ProjectInvite result = projectService.sendTeamInvite(100L, 3L, 2L, "Priya Sharma");

        assertNotNull(result);
        assertEquals("PENDING", result.getStatus());
    }

    @Test
    @DisplayName("Student in solo placeholder team can join existing open team directly")
    void testJoinTeam_SuccessDissolvesSoloTeam() {
        when(teamRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(sampleTeam));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(sampleTopic));
        when(memberRepository.findByTeamId(100L)).thenReturn(List.of(leaderMember));

        ProjectTeamMember soloMember = ProjectTeamMember.builder()
                .id(777L).teamId(200L).topicId(10L).studentId(2L).role("LEADER").build();
        when(memberRepository.findByTopicIdAndStudentId(10L, 2L)).thenReturn(Optional.of(soloMember));
        when(memberRepository.findByTeamId(200L)).thenReturn(List.of(soloMember));
        when(inviteRepository.findByTeamId(200L)).thenReturn(List.of());
        when(inviteRepository.findByTeamIdAndRecipientIdAndStatus(100L, 2L, "PENDING")).thenReturn(Optional.empty());

        ProjectTeam joinedTeam = projectService.joinTeam(100L, 2L, "Priya Sharma", "priya@bridgeai.edu");

        assertNotNull(joinedTeam);
        assertEquals(100L, joinedTeam.getId());
        assertEquals(100L, soloMember.getTeamId());
        assertEquals("MEMBER", soloMember.getRole());
        verify(teamRepository, times(1)).deleteById(200L);
    }

    @Test
    @DisplayName("Join team fails if team is already full")
    void testJoinTeam_FailsWhenTeamFull() {
        sampleTopic.setMaxTeamSize(2);
        when(teamRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(sampleTeam));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(sampleTopic));
        when(memberRepository.findByTeamId(100L)).thenReturn(List.of(
                leaderMember,
                ProjectTeamMember.builder().studentId(5L).teamId(100L).build()
        ));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                projectService.joinTeam(100L, 2L, "Priya Sharma", "priya@bridgeai.edu")
        );
        assertTrue(ex.getMessage().contains("already full"));
    }

    @Test
    @DisplayName("Sending invite fails if team has reached maximum capacity")
    void testSendTeamInvite_FailsWhenTeamFull() {
        sampleTopic.setMaxTeamSize(2);
        when(teamRepository.findById(100L)).thenReturn(Optional.of(sampleTeam));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(sampleTopic));
        when(memberRepository.findByTopicIdAndStudentId(10L, 1L)).thenReturn(Optional.of(leaderMember));

        List<ProjectTeamMember> fullMembers = List.of(
                leaderMember,
                ProjectTeamMember.builder().studentId(9L).teamId(100L).role("MEMBER").build()
        );
        when(memberRepository.findByTeamId(100L)).thenReturn(fullMembers);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                projectService.sendTeamInvite(100L, 2L, 1L, "Rahul Verma")
        );
        assertTrue(ex.getMessage().contains("Team has reached its maximum size"));
    }

    @Test
    @DisplayName("Leader sending invite succeeds and dispatches student notification")
    void testSendTeamInvite_SuccessAndDispatchesNotification() {
        when(teamRepository.findById(100L)).thenReturn(Optional.of(sampleTeam));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(sampleTopic));
        when(memberRepository.findByTopicIdAndStudentId(10L, 1L)).thenReturn(Optional.of(leaderMember));
        when(memberRepository.findByTeamId(100L)).thenReturn(List.of(leaderMember));
        when(selectionRepository.findByTopicIdAndStudentId(10L, 2L)).thenReturn(Optional.of(
                ProjectSelection.builder().topicId(10L).studentId(2L).build()
        ));
        when(memberRepository.findByTopicIdAndStudentId(10L, 2L)).thenReturn(Optional.empty());
        when(inviteRepository.findByTeamIdAndRecipientIdAndStatus(100L, 2L, "PENDING")).thenReturn(Optional.empty());
        when(userRepository.findById(2L)).thenReturn(Optional.of(peerUser));

        ProjectInvite savedInvite = ProjectInvite.builder().id(99L).teamId(100L).topicId(10L).recipientId(2L).status("PENDING").build();
        when(inviteRepository.save(any(ProjectInvite.class))).thenReturn(savedInvite);

        ProjectInvite result = projectService.sendTeamInvite(100L, 2L, 1L, "Rahul Verma");

        assertNotNull(result);
        assertEquals("PENDING", result.getStatus());
        verify(notificationRepository, times(1)).save(argThat(n ->
                n.getUserId().equals(2L) && "PROJECT_INVITE".equals(n.getType())
        ));
    }

    @Test
    @DisplayName("Leader can cancel pending team invite")
    void testCancelTeamInvite_LeaderCanCancel() {
        ProjectInvite invite = ProjectInvite.builder()
                .id(88L).teamId(100L).topicId(10L).senderId(1L).recipientId(2L).status("PENDING").build();
        when(inviteRepository.findById(88L)).thenReturn(Optional.of(invite));
        when(teamRepository.findById(100L)).thenReturn(Optional.of(sampleTeam));
        when(inviteRepository.save(any(ProjectInvite.class))).thenAnswer(inv -> inv.getArgument(0));

        ProjectInvite cancelled = projectService.cancelTeamInvite(88L, 1L);

        assertEquals("CANCELLED", cancelled.getStatus());
        assertNotNull(cancelled.getRespondedAt());
    }

    @Test
    @DisplayName("Declining invite sets DECLINED status and notifies sender")
    void testRespondToInvite_Decline() {
        ProjectInvite invite = ProjectInvite.builder()
                .id(88L).teamId(100L).topicId(10L).senderId(1L).recipientId(2L).teamName("Alpha Team").status("PENDING").build();
        when(inviteRepository.findById(88L)).thenReturn(Optional.of(invite));
        when(inviteRepository.save(any(ProjectInvite.class))).thenAnswer(inv -> inv.getArgument(0));

        ProjectTeam result = projectService.respondToInvite(88L, false, 2L, "Priya Sharma", "priya@bridgeai.edu");

        assertNull(result);
        assertEquals("DECLINED", invite.getStatus());
        verify(notificationRepository, times(1)).save(argThat(n ->
                n.getUserId().equals(1L) && "INVITE_DECLINED".equals(n.getType())
        ));
    }

    @Test
    @DisplayName("Accepting invite transfers peer from solo placeholder team, dissolves placeholder, assigns MEMBER role, and cancels conflicting invites")
    void testRespondToInvite_Accept_TransfersFromPlaceholderTeam() {
        ProjectInvite invite = ProjectInvite.builder()
                .id(88L).teamId(100L).topicId(10L).senderId(1L).recipientId(2L).teamName("Alpha Team").status("PENDING").build();
        when(inviteRepository.findById(88L)).thenReturn(Optional.of(invite));

        // Pessimistic lock mock
        when(teamRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(sampleTeam));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(sampleTopic));
        when(memberRepository.findByTeamId(100L)).thenReturn(new ArrayList<>(List.of(leaderMember)));

        // Peer is currently in a solo placeholder team 200L
        ProjectTeamMember peerOldMember = ProjectTeamMember.builder()
                .id(701L).teamId(200L).topicId(10L).studentId(2L).studentName("Priya Sharma").studentEmail("priya@bridgeai.edu").role("LEADER").build();
        when(memberRepository.findByTopicIdAndStudentId(10L, 2L)).thenReturn(Optional.of(peerOldMember));
        when(memberRepository.findByTeamId(200L)).thenReturn(List.of(peerOldMember));

        when(inviteRepository.findByTeamId(200L)).thenReturn(List.of());
        when(inviteRepository.findByRecipientIdAndTopicIdAndStatus(2L, 10L, "PENDING")).thenReturn(List.of(invite));

        ProjectTeam joinedTeam = projectService.respondToInvite(88L, true, 2L, "Priya Sharma", "priya@bridgeai.edu");

        assertNotNull(joinedTeam);
        assertEquals(100L, joinedTeam.getId());

        // Peer membership transferred and assigned role MEMBER (authoritative leader preserved!)
        assertEquals(100L, peerOldMember.getTeamId());
        assertEquals("MEMBER", peerOldMember.getRole());
        verify(memberRepository, times(1)).save(peerOldMember);

        // Old solo team dissolved
        verify(teamRepository, times(1)).deleteById(200L);

        // Invite accepted
        assertEquals("ACCEPTED", invite.getStatus());
        verify(inviteRepository, times(1)).save(invite);

        // Leader notified
        verify(notificationRepository, times(1)).save(argThat(n ->
                n.getUserId().equals(1L) && "INVITE_ACCEPTED".equals(n.getType())
        ));
    }

    @Test
    @DisplayName("Accepting invite rejects if target team reached max capacity before acceptance")
    void testRespondToInvite_Accept_RejectsWhenTeamFull() {
        sampleTopic.setMaxTeamSize(2);
        ProjectInvite invite = ProjectInvite.builder()
                .id(88L).teamId(100L).topicId(10L).senderId(1L).recipientId(2L).teamName("Alpha Team").status("PENDING").build();
        when(inviteRepository.findById(88L)).thenReturn(Optional.of(invite));
        when(teamRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(sampleTeam));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(sampleTopic));

        // Team already has 2 members
        List<ProjectTeamMember> existingMembers = List.of(
                leaderMember,
                ProjectTeamMember.builder().studentId(3L).teamId(100L).role("MEMBER").build()
        );
        when(memberRepository.findByTeamId(100L)).thenReturn(existingMembers);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                projectService.respondToInvite(88L, true, 2L, "Priya Sharma", "priya@bridgeai.edu")
        );
        assertTrue(ex.getMessage().contains("team is already full"));
        assertEquals("EXPIRED", invite.getStatus());
    }

    @Test
    @DisplayName("Responding to already resolved or expired invite throws exception")
    void testRespondToInvite_AlreadyResolved_ThrowsException() {
        ProjectInvite invite = ProjectInvite.builder()
                .id(88L).teamId(100L).topicId(10L).senderId(1L).recipientId(2L).status("ACCEPTED").build();
        when(inviteRepository.findById(88L)).thenReturn(Optional.of(invite));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                projectService.respondToInvite(88L, true, 2L, "Priya Sharma", "priya@bridgeai.edu")
        );
        assertTrue(ex.getMessage().contains("Invite is no longer pending"));
    }

    @Test
    @DisplayName("Member leaving multi-member team auto-transfers leadership if leader, and re-creates solo team")
    void testLeaveTeam_TransfersLeadershipAndCreatesSoloTeam() {
        ProjectTeamMember teammateMember = ProjectTeamMember.builder()
                .id(502L).teamId(100L).topicId(10L).studentId(2L).studentName("Priya Sharma").studentEmail("priya@bridgeai.edu").role("MEMBER").joinedAt(LocalDateTime.now().minusHours(1)).build();

        when(memberRepository.findByTopicIdAndStudentId(10L, 1L)).thenReturn(Optional.of(leaderMember));
        when(teamRepository.findById(100L)).thenReturn(Optional.of(sampleTeam));
        when(memberRepository.findByTeamId(100L)).thenReturn(List.of(leaderMember, teammateMember));

        ProjectTeam soloCreated = ProjectTeam.builder().id(999L).topicId(10L).teamName("Rahul Verma's Team").leaderId(1L).build();
        when(teamRepository.save(any(ProjectTeam.class))).thenReturn(soloCreated);

        ProjectTeam result = projectService.leaveTeam(10L, 1L);

        assertNotNull(result);
        // Leadership auto-transferred to remaining teammate
        assertEquals("LEADER", teammateMember.getRole());
        verify(memberRepository, times(1)).save(teammateMember);
        verify(memberRepository, times(1)).delete(leaderMember);
        // Solo team created for leaving user so they are not left teamless
        verify(teamRepository, atLeastOnce()).save(any(ProjectTeam.class));
    }
}
