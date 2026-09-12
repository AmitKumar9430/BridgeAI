package com.bridgeai.portal.dto;

import com.bridgeai.portal.model.ProjectInvite;
import com.bridgeai.portal.model.ProjectSelection;
import com.bridgeai.portal.model.ProjectTeam;
import com.bridgeai.portal.model.ProjectTeamMember;
import com.bridgeai.portal.model.ProjectWork;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

public class ProjectDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateProjectRequest {
        private Long courseId;
        private String title;
        private String description;
        private String requirements;
        private String subjectName;
        private LocalDateTime deadline;
        private Integer maxScore;
        private Integer minTeamSize;
        private Integer maxTeamSize;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SelectProjectRequest {
        private Long topicId;
        private Long projectId; // alias for backwards compatibility
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateTeamRequest {
        private Long topicId;
        private String teamName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SendInviteRequest {
        private Long teamId;
        private Long recipientStudentId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RespondInviteRequest {
        private Long inviteId;
        private boolean accept;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SubmitTeamDeliverablesRequest {
        private Long teamId;
        private String zipFileUrl;
        private String pptFileUrl;
        private String pdfReportUrl;
        private String githubRepoUrl;
        private String liveDemoUrl;
        private String studentComments;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GradeTeamRequest {
        private Integer score;
        private String feedback;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class JoinTeamRequest {
        private Long teamId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudentPeerDto {
        private Long studentId;
        private String studentName;
        private String studentEmail;
        private boolean hasTeam;
        private Long teamId;
        private String teamName;
        private int teamMemberCount;
        private int teamCapacity;
        private boolean teamHasSpace;
        private boolean alreadyInvited;
        private boolean isCommittedMultiMember;
        private boolean isMyTeammate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TeamDetailsDto {
        private ProjectTeam team;
        private ProjectWork topic;
        private List<ProjectTeamMember> members;
        private List<ProjectInvite> pendingSentInvites;
        private boolean isCurrentMember;
        private boolean isLeader;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopicOverviewDto {
        private ProjectWork topic;
        private long totalSelectedCount;
        private boolean isSelectedByMe;
        private TeamDetailsDto myTeam;
    }

    // Legacy requests
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SubmitProjectRequest {
        private Long projectId;
        private String zipFileUrl;
        private String pptFileUrl;
        private String pdfReportUrl;
        private String githubRepoUrl;
        private String liveDemoUrl;
        private String studentComments;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GradeProjectRequest {
        private Integer score;
        private String feedback;
        private String status;
    }
}
