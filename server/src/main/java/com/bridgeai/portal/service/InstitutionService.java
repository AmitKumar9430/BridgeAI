package com.bridgeai.portal.service;

import com.bridgeai.portal.dto.AuthDtos.CreateUserRequest;
import com.bridgeai.portal.dto.InstitutionDtos.*;
import com.bridgeai.portal.model.*;
import com.bridgeai.portal.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InstitutionService {

    private final InstitutionRepository institutionRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CourseModuleRepository moduleRepository;
    private final CourseTrainerRepository courseTrainerRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final CertificateRepository certificateRepository;
    private final LiveSessionRepository liveSessionRepository;
    private final ExamRepository examRepository;
    private final AuthService authService;
    private final AuditLogService auditLogService;

    @Transactional
    public InstitutionDto enrollInstitution(EnrollInstitutionRequest req, String actor, String ip) {
        String name = req.getName().trim();
        if (institutionRepository.existsByName(name)) {
            throw new IllegalArgumentException("Institution with name '" + name + "' is already enrolled on the portal.");
        }

        Institution institution = Institution.builder()
                .name(name)
                .code(req.getCode() != null ? req.getCode().trim().toUpperCase() : null)
                .category(req.getCategory() != null ? req.getCategory().trim() : "Institute of National Importance")
                .accreditation(req.getAccreditation() != null ? req.getAccreditation().trim() : "NAAC A++")
                .contactEmail(req.getContactEmail() != null ? req.getContactEmail().trim().toLowerCase() : null)
                .contactPhone(req.getContactPhone() != null ? req.getContactPhone().trim() : null)
                .websiteUrl(req.getWebsiteUrl() != null ? req.getWebsiteUrl().trim() : null)
                .establishedYear(req.getEstablishedYear() != null ? req.getEstablishedYear() : 1960)
                .campusAddress(req.getCampusAddress().trim())
                .city(req.getCity().trim())
                .state(req.getState().trim())
                .postalCode(req.getPostalCode() != null ? req.getPostalCode().trim() : null)
                .country(req.getCountry() != null && !req.getCountry().isBlank() ? req.getCountry().trim() : "India")
                .status("ACTIVE")
                .maxStrikesAllowed(req.getMaxStrikesAllowed() != null && req.getMaxStrikesAllowed() > 0 ? req.getMaxStrikesAllowed() : 3)
                .description(req.getDescription() != null ? req.getDescription().trim() : null)
                .createdAt(LocalDateTime.now())
                .build();

        institutionRepository.save(institution);

        // Provision initial Lead Super Admin if details provided
        if (req.getSuperAdminEmail() != null && !req.getSuperAdminEmail().isBlank()
                && req.getSuperAdminFullName() != null && !req.getSuperAdminFullName().isBlank()) {
            CreateUserRequest saReq = CreateUserRequest.builder()
                    .fullName(req.getSuperAdminFullName().trim())
                    .email(req.getSuperAdminEmail().trim())
                    .phone(req.getSuperAdminPhone() != null ? req.getSuperAdminPhone().trim() : null)
                    .password(req.getSuperAdminPassword() != null && !req.getSuperAdminPassword().isBlank()
                            ? req.getSuperAdminPassword().trim() : "SuperAdmin@2026")
                    .institutionName(name)
                    .details(req.getSuperAdminDesignation() != null ? req.getSuperAdminDesignation().trim() : "Lead Super Admin")
                    .build();

            authService.createSuperAdmin(saReq, actor, ip);
        }

        // Provision initial curriculum subjects running under this institution
        if (req.getInitialSubjects() != null && !req.getInitialSubjects().isEmpty()) {
            String[] defaultColors = new String[]{"#0F172A", "#2563EB", "#059669", "#7C3AED", "#D97706", "#DC2626"};
            int colorIdx = 0;
            for (InitialSubjectItem sub : req.getInitialSubjects()) {
                if (sub.getTitle() != null && !sub.getTitle().isBlank()) {
                    Course course = Course.builder()
                            .title(sub.getTitle().trim())
                            .category(sub.getCategory() != null && !sub.getCategory().isBlank() ? sub.getCategory().trim() : "Computer Science & Engineering")
                            .description(sub.getDescription() != null && !sub.getDescription().isBlank() ? sub.getDescription().trim() : "Core curriculum subject running under " + name)
                            .institutionName(name)
                            .badgeColor(defaultColors[colorIdx % defaultColors.length])
                            .startDate(java.time.LocalDate.now())
                            .endDate(java.time.LocalDate.now().plusMonths(6))
                            .enrolledCount(0)
                            .progressPercentage(0)
                            .createdAt(LocalDateTime.now())
                            .build();
                    Course savedCourse = courseRepository.save(course);
                    colorIdx++;

                    // Create standard initial module for this new subject
                    CourseModule m1 = CourseModule.builder()
                            .courseId(savedCourse.getId())
                            .title("Module 1: Foundations & Core Concepts")
                            .description("Fundamental theory, syllabus roadmap, and introductory study materials for " + savedCourse.getTitle())
                            .orderIndex(1)
                            .createdAt(LocalDateTime.now())
                            .build();
                    moduleRepository.save(m1);
                }
            }
        }

        auditLogService.log(actor, "ROLE_BOSS_ADMIN", "INSTITUTION_ENROLLED", "Institution", institution.getId(),
                "Boss Admin enrolled institution: " + institution.getName() + " in " + institution.getCity() + ", " + institution.getState() +
                (req.getInitialSubjects() != null ? " with " + req.getInitialSubjects().size() + " running subjects" : ""), ip);

        return toDto(institution);
    }

    public List<InstitutionDto> getAllInstitutions() {
        return institutionRepository.findAll().stream().map(this::toDto).toList();
    }

    public InstitutionDto getInstitutionById(Long id) {
        Institution inst = institutionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Institution not found with ID: " + id));
        return toDto(inst);
    }

    public InstitutionDto getInstitutionByName(String name) {
        if (name == null || name.isBlank()) return null;
        return institutionRepository.findByName(name.trim()).map(this::toDto).orElse(null);
    }

    public List<HierarchyInstitutionNode> getHierarchyTree() {
        List<Institution> institutions = institutionRepository.findAll();
        List<HierarchyInstitutionNode> nodes = new ArrayList<>();

        for (Institution inst : institutions) {
            String instName = inst.getName();
            List<User> superAdmins = userRepository.findByRoleAndInstitutionName(Role.ROLE_SUPER_ADMIN, instName);
            List<User> trainers = userRepository.findByRoleAndInstitutionName(Role.ROLE_TRAINER, instName);
            List<User> students = userRepository.findByRoleAndInstitutionName(Role.ROLE_STUDENT, instName);
            List<Course> allCourses = courseRepository.findAll();

            List<HierarchySuperAdminNode> saNodes = new ArrayList<>();
            for (User sa : superAdmins) {
                // Find trainers linked to this super admin or all trainers if single/shared
                List<User> saTrainers = trainers.stream()
                        .filter(t -> t.getSuperAdminId() != null ? t.getSuperAdminId().equals(sa.getId()) : true)
                        .toList();

                List<HierarchyTrainerNode> trainerNodes = new ArrayList<>();
                for (User t : saTrainers) {
                    List<Map<String, Object>> trainerCourses = new ArrayList<>();
                    for (Course c : allCourses) {
                        boolean isLead = (c.getTrainerId() != null && c.getTrainerId().equals(t.getId())) ||
                                         (c.getTrainerName() != null && c.getTrainerName().equalsIgnoreCase(t.getFullName()));
                        boolean isJoint = courseTrainerRepository.findByCourseId(c.getId()).stream()
                                .anyMatch(ct -> ct.getTrainerId().equals(t.getId()));
                        if (isLead || isJoint) {
                            Map<String, Object> cMap = new HashMap<>();
                            cMap.put("id", c.getId());
                            cMap.put("title", c.getTitle());
                            cMap.put("category", c.getCategory());
                            cMap.put("isLead", isLead);
                            trainerCourses.add(cMap);
                        }
                    }

                    trainerNodes.add(HierarchyTrainerNode.builder()
                            .id(t.getId())
                            .fullName(t.getFullName())
                            .email(t.getEmail())
                            .phone(t.getPhone())
                            .assignedSubject(t.getAssignedSubject())
                            .domainSpecialization(t.getAssignedSubject() != null ? t.getAssignedSubject() : "Computer Science & AI")
                            .superAdminId(t.getSuperAdminId())
                            .superAdminName(t.getSuperAdminName() != null ? t.getSuperAdminName() : sa.getFullName())
                            .active(t.isActive())
                            .courses(trainerCourses)
                            .build());
                }

                saNodes.add(HierarchySuperAdminNode.builder()
                        .id(sa.getId())
                        .fullName(sa.getFullName())
                        .email(sa.getEmail())
                        .phone(sa.getPhone())
                        .active(sa.isActive())
                        .institutionName(sa.getInstitutionName())
                        .trainers(trainerNodes)
                        .build());
            }

            // Courses running under this specific institution
            List<Course> instCourses = courseRepository.findByInstitutionName(instName);
            if (instCourses.isEmpty() && (instName.contains("IIT") || instName.contains("Indian Institute of Technology"))) {
                instCourses = allCourses.stream()
                        .filter(c -> c.getInstitutionName() == null || c.getInstitutionName().equalsIgnoreCase(instName))
                        .toList();
            }

            List<Map<String, Object>> subjectMaps = new ArrayList<>();
            for (Course c : instCourses) {
                Map<String, Object> cInfo = new HashMap<>();
                cInfo.put("id", c.getId());
                cInfo.put("title", c.getTitle());
                cInfo.put("category", c.getCategory());
                cInfo.put("description", c.getDescription());
                cInfo.put("badgeColor", c.getBadgeColor());
                cInfo.put("enrolledCount", c.getEnrolledCount());
                cInfo.put("progressPercentage", c.getProgressPercentage());

                // Find assigned trainers for this course
                List<CourseTrainer> assigned = courseTrainerRepository.findByCourseId(c.getId());
                List<String> assignedTrainers = new ArrayList<>();
                if (c.getTrainerName() != null && !c.getTrainerName().isBlank()) {
                    assignedTrainers.add(c.getTrainerName());
                }
                for (CourseTrainer ct : assigned) {
                    if (!assignedTrainers.contains(ct.getTrainerName())) {
                        assignedTrainers.add(ct.getTrainerName());
                    }
                }
                cInfo.put("assignedTrainers", assignedTrainers);
                cInfo.put("trainerCount", assignedTrainers.size());
                cInfo.put("leadTrainer", c.getTrainerName() != null ? c.getTrainerName() : (!assignedTrainers.isEmpty() ? assignedTrainers.get(0) : null));
                subjectMaps.add(cInfo);
            }

            nodes.add(HierarchyInstitutionNode.builder()
                    .id(inst.getId())
                    .name(inst.getName())
                    .code(inst.getCode())
                    .category(inst.getCategory())
                    .accreditation(inst.getAccreditation())
                    .campusAddress(inst.getCampusAddress())
                    .city(inst.getCity())
                    .state(inst.getState())
                    .postalCode(inst.getPostalCode())
                    .country(inst.getCountry())
                    .contactEmail(inst.getContactEmail())
                    .contactPhone(inst.getContactPhone())
                    .websiteUrl(inst.getWebsiteUrl())
                    .establishedYear(inst.getEstablishedYear())
                    .status(inst.getStatus())
                    .maxStrikesAllowed(inst.getMaxStrikesAllowed() > 0 ? inst.getMaxStrikesAllowed() : 3)
                    .totalSuperAdmins(superAdmins.size())
                    .totalTrainers(trainers.size())
                    .totalStudents(students.size())
                    .totalCourses(instCourses.size())
                    .subjects(subjectMaps)
                    .superAdmins(saNodes)
                    .build());
        }

        return nodes;
    }

    public UserFullProfileDto getUserFullProfile(Long userId, Authentication auth) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        Map<String, Object> meta = new HashMap<>();
        List<Map<String, Object>> related = new ArrayList<>();

        if (user.getRole() == Role.ROLE_SUPER_ADMIN) {
            String instName = user.getInstitutionName();
            Institution inst = instName != null ? institutionRepository.findByName(instName).orElse(null) : null;
            if (inst != null) {
                meta.put("campusAddress", inst.getCampusAddress());
                meta.put("city", inst.getCity());
                meta.put("state", inst.getState());
                meta.put("postalCode", inst.getPostalCode());
                meta.put("accreditation", inst.getAccreditation());
                meta.put("establishedYear", inst.getEstablishedYear());
                meta.put("websiteUrl", inst.getWebsiteUrl());
            }

            List<User> managedTrainers = instName != null ? userRepository.findByRoleAndInstitutionName(Role.ROLE_TRAINER, instName) : List.of();
            List<User> managedStudents = instName != null ? userRepository.findByRoleAndInstitutionName(Role.ROLE_STUDENT, instName) : List.of();
            meta.put("managedTrainersCount", managedTrainers.size());
            meta.put("managedStudentsCount", managedStudents.size());

            // Co-Super Admins
            List<String> coAdmins = instName != null ? userRepository.findByRoleAndInstitutionName(Role.ROLE_SUPER_ADMIN, instName).stream()
                    .map(u -> u.getFullName() + " (" + u.getEmail() + ")").toList() : List.of();
            meta.put("coSuperAdmins", coAdmins);

            // Related trainers list
            for (User t : managedTrainers) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", t.getId());
                item.put("name", t.getFullName());
                item.put("email", t.getEmail());
                item.put("role", "Faculty Trainer");
                item.put("specialization", t.getAssignedSubject());
                related.add(item);
            }
        } else if (user.getRole() == Role.ROLE_TRAINER) {
            meta.put("domainSpecialization", user.getAssignedSubject() != null ? user.getAssignedSubject() : "Computer Science & AI");
            meta.put("supervisingSuperAdmin", user.getSuperAdminName() != null ? user.getSuperAdminName() : "Lead Super Admin");

            List<Course> courses = courseRepository.findAll().stream()
                    .filter(c -> (c.getTrainerId() != null && c.getTrainerId().equals(user.getId())) ||
                                 (c.getTrainerName() != null && c.getTrainerName().equalsIgnoreCase(user.getFullName())))
                    .toList();
            meta.put("assignedCoursesCount", courses.size());

            int sessionsCount = (int) liveSessionRepository.count();
            meta.put("sessionsConducted", sessionsCount);

            for (Course c : courses) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", c.getId());
                item.put("title", c.getTitle());
                item.put("category", c.getCategory());
                item.put("enrolledCount", c.getEnrolledCount());
                related.add(item);
            }
        } else if (user.getRole() == Role.ROLE_STUDENT) {
            List<AssignmentSubmission> subs = submissionRepository.findByStudentId(user.getId());
            meta.put("assignmentSubmissionsCount", subs.size());
            meta.put("evaluatedCount", subs.stream().filter(s -> "CHECKED".equalsIgnoreCase(s.getStatus())).count());

            List<ExamAttempt> attempts = examAttemptRepository.findByStudentId(user.getId());
            meta.put("examAttemptsCount", attempts.size());

            List<Certificate> certs = certificateRepository.findByStudentId(user.getId());
            meta.put("certificatesCount", certs.size());

            for (AssignmentSubmission s : subs) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", s.getId());
                item.put("assignmentId", s.getAssignmentId());
                item.put("status", s.getStatus());
                item.put("score", s.getScore());
                item.put("grade", s.getGrade());
                related.add(item);
            }
        }

        return UserFullProfileDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .active(user.isActive())
                .institutionName(user.getInstitutionName())
                .assignedSubject(user.getAssignedSubject())
                .superAdminId(user.getSuperAdminId())
                .superAdminName(user.getSuperAdminName())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .metadata(meta)
                .relatedItems(related)
                .build();
    }

    private InstitutionDto toDto(Institution inst) {
        String name = inst.getName();
        int saCount = userRepository.findByRoleAndInstitutionName(Role.ROLE_SUPER_ADMIN, name).size();
        int trCount = userRepository.findByRoleAndInstitutionName(Role.ROLE_TRAINER, name).size();
        int stCount = userRepository.findByRoleAndInstitutionName(Role.ROLE_STUDENT, name).size();
        List<Course> instCourses = courseRepository.findByInstitutionName(name);
        int cCount = instCourses.size();
        if (cCount == 0 && (name.contains("IIT") || name.contains("Indian Institute of Technology"))) {
            cCount = (int) courseRepository.findAll().stream()
                    .filter(c -> c.getInstitutionName() == null || c.getInstitutionName().equalsIgnoreCase(name))
                    .count();
        }

        return InstitutionDto.builder()
                .id(inst.getId())
                .name(inst.getName())
                .code(inst.getCode())
                .category(inst.getCategory())
                .accreditation(inst.getAccreditation())
                .contactEmail(inst.getContactEmail())
                .contactPhone(inst.getContactPhone())
                .websiteUrl(inst.getWebsiteUrl())
                .establishedYear(inst.getEstablishedYear())
                .campusAddress(inst.getCampusAddress())
                .city(inst.getCity())
                .state(inst.getState())
                .postalCode(inst.getPostalCode())
                .country(inst.getCountry())
                .status(inst.getStatus())
                .maxStrikesAllowed(inst.getMaxStrikesAllowed() > 0 ? inst.getMaxStrikesAllowed() : 3)
                .description(inst.getDescription())
                .logoUrl(inst.getLogoUrl())
                .createdAt(inst.getCreatedAt())
                .superAdminCount(saCount)
                .trainerCount(trCount)
                .studentCount(stCount)
                .courseCount(cCount)
                .build();
    }


    @Transactional
    public InstitutionDto updateInstitution(Long id, EnrollInstitutionRequest req, String actor, String ip) {
        Institution inst = institutionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Institution not found with id: " + id));
        if (req.getName() != null && !req.getName().isBlank()) inst.setName(req.getName().trim());
        if (req.getCode() != null) inst.setCode(req.getCode().trim().toUpperCase());
        if (req.getCategory() != null) inst.setCategory(req.getCategory().trim());
        if (req.getAccreditation() != null) inst.setAccreditation(req.getAccreditation().trim());
        if (req.getContactEmail() != null) inst.setContactEmail(req.getContactEmail().trim());
        if (req.getContactPhone() != null) inst.setContactPhone(req.getContactPhone().trim());
        if (req.getWebsiteUrl() != null) inst.setWebsiteUrl(req.getWebsiteUrl().trim());
        if (req.getEstablishedYear() != null && req.getEstablishedYear() > 0) inst.setEstablishedYear(req.getEstablishedYear());
        if (req.getCampusAddress() != null) inst.setCampusAddress(req.getCampusAddress().trim());
        if (req.getCity() != null) inst.setCity(req.getCity().trim());
        if (req.getState() != null) inst.setState(req.getState().trim());
        if (req.getPostalCode() != null) inst.setPostalCode(req.getPostalCode().trim());
        if (req.getMaxStrikesAllowed() != null && req.getMaxStrikesAllowed() > 0) {
            int newMax = req.getMaxStrikesAllowed();
            inst.setMaxStrikesAllowed(newMax);
            // Propagate updated max strikes to all exams under this institution
            List<Exam> allExams = examRepository.findAll();
            List<Exam> examsToUpdate = allExams.stream()
                    .filter(ex -> {
                        if (ex.getInstitutionId() != null && ex.getInstitutionId().equals(inst.getId())) return true;
                        if (ex.getInstitutionName() != null && !ex.getInstitutionName().isBlank()) {
                            String exName = ex.getInstitutionName().trim();
                            if (exName.equalsIgnoreCase(inst.getName())) return true;
                            if (inst.getCode() != null && exName.toUpperCase().contains(inst.getCode().toUpperCase())) return true;
                            if (inst.getName().toUpperCase().contains("IIT") && exName.toUpperCase().contains("IIT")) return true;
                        }
                        return false;
                    })
                    .toList();

            for (Exam ex : examsToUpdate) {
                ex.setInstitutionId(inst.getId());
                ex.setInstitutionName(inst.getName());
                ex.setMaxViolations(newMax);
            }
            if (!examsToUpdate.isEmpty()) {
                examRepository.saveAll(examsToUpdate);
            }
        }
        if (req.getDescription() != null) inst.setDescription(req.getDescription().trim());
        institutionRepository.save(inst);
        auditLogService.log(actor, "BOSS_ADMIN", "INSTITUTION_UPDATED", "Institution", inst.getId(),
                "Updated institution profile for: " + inst.getName() + " (Max Strikes: " + inst.getMaxStrikesAllowed() + ")", ip);
        return toDto(inst);
    

    }
    @Transactional
    public void syncAllExamStrikesWithInstitutions() {
        List<Institution> institutions = institutionRepository.findAll();
        List<Exam> allExams = examRepository.findAll();
        boolean anyChanged = false;

        for (Exam ex : allExams) {
            Institution matchedInst = null;
            if (ex.getInstitutionId() != null) {
                matchedInst = institutionRepository.findById(ex.getInstitutionId()).orElse(null);
            }
            if (matchedInst == null && ex.getInstitutionName() != null && !ex.getInstitutionName().isBlank()) {
                String exName = ex.getInstitutionName().trim();
                matchedInst = institutions.stream()
                        .filter(i -> i.getName().equalsIgnoreCase(exName)
                                || (i.getCode() != null && exName.toUpperCase().contains(i.getCode().toUpperCase()))
                                || (i.getName().toUpperCase().contains("IIT") && exName.toUpperCase().contains("IIT")))
                        .findFirst().orElse(null);
            }
            if (matchedInst == null && ex.getCourseId() != null) {
                Course c = courseRepository.findById(ex.getCourseId()).orElse(null);
                if (c != null && c.getInstitutionName() != null && !c.getInstitutionName().isBlank()) {
                    String cName = c.getInstitutionName().trim();
                    matchedInst = institutions.stream()
                            .filter(i -> i.getName().equalsIgnoreCase(cName)
                                    || (i.getCode() != null && cName.toUpperCase().contains(i.getCode().toUpperCase()))
                                    || (i.getName().toUpperCase().contains("IIT") && cName.toUpperCase().contains("IIT")))
                            .findFirst().orElse(null);
                }
            }
            if (matchedInst != null && matchedInst.getMaxStrikesAllowed() > 0) {
                if (ex.getMaxViolations() != matchedInst.getMaxStrikesAllowed()
                        || ex.getInstitutionId() == null
                        || ex.getInstitutionName() == null) {
                    ex.setInstitutionId(matchedInst.getId());
                    ex.setInstitutionName(matchedInst.getName());
                    ex.setMaxViolations(matchedInst.getMaxStrikesAllowed());
                    anyChanged = true;
                }
            }
        }
        if (anyChanged) {
            examRepository.saveAll(allExams);
            log.info("Synchronized institutional max strikes for existing exams.");
        }
    }

    @Transactional
    public void deleteInstitution(Long id, String actor, String ip) {
        Institution inst = institutionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Institution not found with id: " + id));
        String name = inst.getName();
        institutionRepository.delete(inst);
        auditLogService.log(actor, "BOSS_ADMIN", "INSTITUTION_DELETED", "Institution", id,
                "Deleted institution: " + name, ip);
    }
}
