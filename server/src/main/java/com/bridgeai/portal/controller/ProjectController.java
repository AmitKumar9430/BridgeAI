package com.bridgeai.portal.controller;

import com.bridgeai.portal.dto.ProjectDtos.*;
import com.bridgeai.portal.model.*;
import com.bridgeai.portal.repository.ProjectWorkRepository;
import com.bridgeai.portal.repository.UserRepository;
import com.bridgeai.portal.security.InstitutionSecurityUtils;
import com.bridgeai.portal.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final UserRepository userRepository;
    private final ProjectWorkRepository projectWorkRepository;
    private final InstitutionSecurityUtils institutionSecurityUtils;

    private User resolveUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    private User requireUser(Authentication auth) {
        User user = resolveUser(auth);
        if (user == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Unauthorized: Authentication required");
        }
        return user;
    }

    @GetMapping
    public ResponseEntity<List<ProjectWork>> getAllProjects(Authentication auth) {
        User user = resolveUser(auth);
        return ResponseEntity.ok(projectService.getAllProjects(user));
    }

    @GetMapping("/topics")
    public ResponseEntity<List<ProjectWork>> getAvailableTopics(Authentication auth) {
        User user = resolveUser(auth);
        return ResponseEntity.ok(projectService.getAvailableTopics(user));
    }

    @GetMapping("/my-projects")
    public ResponseEntity<List<ProjectWork>> getMyProjects(Authentication auth) {
        User user = requireUser(auth);
        return ResponseEntity.ok(projectService.getProjectsByStudent(user.getId()));
    }

    @GetMapping("/trainer/{trainerId}")
    public ResponseEntity<List<ProjectWork>> getProjectsByTrainer(@PathVariable Long trainerId) {
        return ResponseEntity.ok(projectService.getProjectsByTrainer(trainerId));
    }

    @PostMapping("/topics")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<ProjectWork> createProjectTopic(@RequestBody CreateProjectRequest req, Authentication auth) {
        User user = requireUser(auth);
        String trainerName = user.getFullName() != null ? user.getFullName() : "Trainer";
        String instName = user.getInstitutionName() != null ? user.getInstitutionName() : "Main Institute";
        return ResponseEntity.ok(projectService.createProjectTopic(req, user.getId(), trainerName, instName, user.getInstitutionId()));
    }

    // 1. Topic selection
    @PostMapping("/select")
    public ResponseEntity<ProjectSelection> selectTopic(@RequestBody SelectProjectRequest req, Authentication auth) {
        User user = requireUser(auth);
        String studentName = user.getFullName() != null ? user.getFullName() : "Student";
        String studentEmail = user.getEmail();
        String instName = user.getInstitutionName() != null ? user.getInstitutionName() : "Main Institute";
        Long topicId = req.getTopicId() != null ? req.getTopicId() : req.getProjectId();
        return ResponseEntity.ok(projectService.selectTopic(topicId, user.getId(), studentName, studentEmail, instName));
    }

    // 2. Discover peers who also selected the same topic
    @GetMapping("/topics/{topicId}/peers")
    public ResponseEntity<List<StudentPeerDto>> getTopicPeers(@PathVariable Long topicId, Authentication auth) {
        User user = requireUser(auth);
        return ResponseEntity.ok(projectService.getEligiblePeers(topicId, user.getId()));
    }

    // 3. Create or rename team
    @PostMapping("/teams")
    public ResponseEntity<ProjectTeam> createOrRenameTeam(@RequestBody CreateTeamRequest req, Authentication auth) {
        User user = requireUser(auth);
        String studentName = user.getFullName() != null ? user.getFullName() : "Student";
        String studentEmail = user.getEmail();
        return ResponseEntity.ok(projectService.createOrRenameTeam(req.getTopicId(), req.getTeamName(), user.getId(), studentName, studentEmail));
    }

    // 4. Get student's team details & shared deliverables for a topic
    @GetMapping("/my-team")
    public ResponseEntity<TeamDetailsDto> getMyTeam(@RequestParam Long topicId, Authentication auth) {
        User user = requireUser(auth);
        return ResponseEntity.ok(projectService.getMyTeamForTopic(topicId, user.getId()));
    }

    // 5. Send team invite to a peer who chose the same topic
    @PostMapping("/invites/send")
    public ResponseEntity<ProjectInvite> sendTeamInvite(@RequestBody SendInviteRequest req, Authentication auth) {
        User user = requireUser(auth);
        String senderName = user.getFullName() != null ? user.getFullName() : "Student";
        return ResponseEntity.ok(projectService.sendTeamInvite(req.getTeamId(), req.getRecipientStudentId(), user.getId(), senderName));
    }

    // 6. Get pending team invites for the current student
    @GetMapping("/invites/received")
    public ResponseEntity<List<ProjectInvite>> getMyPendingInvites(Authentication auth) {
        User user = requireUser(auth);
        return ResponseEntity.ok(projectService.getPendingInvitesForStudent(user.getId()));
    }

    // 7. Accept or decline team invite
    @PostMapping("/invites/{inviteId}/respond")
    public ResponseEntity<ProjectTeam> respondToInvite(
            @PathVariable Long inviteId,
            @RequestBody RespondInviteRequest req,
            Authentication auth) {
        User user = requireUser(auth);
        String studentName = user.getFullName() != null ? user.getFullName() : "Student";
        String studentEmail = user.getEmail();
        return ResponseEntity.ok(projectService.respondToInvite(inviteId, req.isAccept(), user.getId(), studentName, studentEmail));
    }

    // 8. Cancel team invite (Team leader can cancel pending invite)
    @PostMapping("/invites/{inviteId}/cancel")
    public ResponseEntity<ProjectInvite> cancelTeamInvite(@PathVariable Long inviteId, Authentication auth) {
        User user = requireUser(auth);
        return ResponseEntity.ok(projectService.cancelTeamInvite(inviteId, user.getId()));
    }

    // 9. Join existing open team
    @PostMapping("/teams/{teamId}/join")
    public ResponseEntity<ProjectTeam> joinTeam(@PathVariable Long teamId, Authentication auth) {
        User user = requireUser(auth);
        String studentName = user.getFullName() != null ? user.getFullName() : "Student";
        String studentEmail = user.getEmail();
        return ResponseEntity.ok(projectService.joinTeam(teamId, user.getId(), studentName, studentEmail));
    }

    // 10. Leave team
    @PostMapping("/teams/{topicId}/leave")
    public ResponseEntity<ProjectTeam> leaveTeam(@PathVariable Long topicId, Authentication auth) {
        User user = requireUser(auth);
        return ResponseEntity.ok(projectService.leaveTeam(topicId, user.getId()));
    }

    // 10. Upload / Update shared team deliverables (Any teammate can call this)
    @PostMapping("/teams/{teamId}/submit")
    public ResponseEntity<ProjectTeam> submitTeamDeliverables(
            @PathVariable Long teamId,
            @RequestBody SubmitTeamDeliverablesRequest req,
            Authentication auth) {
        User user = requireUser(auth);
        String studentName = user.getFullName() != null ? user.getFullName() : "Student";
        req.setTeamId(teamId);
        return ResponseEntity.ok(projectService.submitTeamDeliverables(req, user.getId(), studentName));
    }

    // 11. Trainer gets all teams for a topic
    @GetMapping("/topics/{topicId}/teams")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<List<TeamDetailsDto>> getTeamsForTopic(@PathVariable Long topicId, Authentication auth) {
        User user = requireUser(auth);
        ProjectWork topic = projectWorkRepository.findById(topicId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Topic not found"));
        institutionSecurityUtils.assertInstitutionAccess(user, topic.getInstitutionId(), topic.getInstitutionName());
        return ResponseEntity.ok(projectService.getTeamsForTopic(topicId));
    }

    // 12. Trainer grades team deliverables
    @PostMapping("/teams/{teamId}/evaluate")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<ProjectTeam> gradeTeam(
            @PathVariable Long teamId,
            @RequestBody GradeTeamRequest req,
            Authentication auth) {
        User user = requireUser(auth);
        return ResponseEntity.ok(projectService.gradeTeam(teamId, req, user.getId()));
    }

    // Legacy submission & grade endpoints
    @PostMapping("/submit")
    public ResponseEntity<ProjectWork> submitProject(@RequestBody SubmitProjectRequest req, Authentication auth) {
        User user = requireUser(auth);
        return ResponseEntity.ok(projectService.submitDeliverables(req, user.getId()));
    }

    @PostMapping("/{projectId}/evaluate")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<ProjectWork> gradeProject(
            @PathVariable Long projectId,
            @RequestBody GradeProjectRequest req,
            Authentication auth) {
        User user = requireUser(auth);
        ProjectWork project = projectWorkRepository.findById(projectId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Project not found"));
        institutionSecurityUtils.assertInstitutionAccess(user, project.getInstitutionId(), project.getInstitutionName());
        return ResponseEntity.ok(projectService.gradeProject(projectId, req, user.getId()));
    }

    @PutMapping("/topics/{topicId}")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<ProjectWork> updateProjectTopic(
            @PathVariable Long topicId,
            @RequestBody CreateProjectRequest req,
            Authentication auth) {
        User user = requireUser(auth);
        ProjectWork topic = projectWorkRepository.findById(topicId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Topic not found"));
        institutionSecurityUtils.assertInstitutionAccess(user, topic.getInstitutionId(), topic.getInstitutionName());
        return ResponseEntity.ok(projectService.updateProjectTopic(topicId, req));
    }

    @DeleteMapping("/topics/{topicId}")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<Void> deleteProjectTopic(@PathVariable Long topicId, Authentication auth) {
        User user = requireUser(auth);
        ProjectWork topic = projectWorkRepository.findById(topicId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Topic not found"));
        institutionSecurityUtils.assertInstitutionAccess(user, topic.getInstitutionId(), topic.getInstitutionName());
        projectService.deleteProjectTopic(topicId);
        return ResponseEntity.noContent().build();
    }
}
