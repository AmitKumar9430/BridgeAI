package com.bridgeai.portal.service;

import com.bridgeai.portal.dto.CourseDtos.*;
import com.bridgeai.portal.model.Course;
import com.bridgeai.portal.model.CourseModule;
import com.bridgeai.portal.model.CourseTrainer;
import com.bridgeai.portal.model.ResourceItem;
import com.bridgeai.portal.model.Exam;
import com.bridgeai.portal.model.ExamQuestion;
import com.bridgeai.portal.model.User;
import com.bridgeai.portal.model.Role;
import com.bridgeai.portal.dto.ExamDtos.CreateQuestionDto;
import com.bridgeai.portal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TrainingService {

    private final CourseRepository courseRepository;
    private final CourseModuleRepository moduleRepository;
    private final ResourceItemRepository resourceRepository;
    private final AssignmentRepository assignmentRepository;
    private final LiveSessionRepository liveSessionRepository;
    private final CourseTrainerRepository courseTrainerRepository;
    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final ExamQuestionRepository questionRepository;
    private final InstitutionRepository institutionRepository;
    private final AuditLogService auditLogService;
    private final com.bridgeai.portal.security.InstitutionSecurityUtils institutionSecurityUtils;

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public List<Course> getCoursesByInstitution(String institutionName) {
        if (institutionName == null || institutionName.isBlank()) {
            return courseRepository.findAll();
        }
        List<Course> list = courseRepository.findByInstitutionName(institutionName.trim());
        if (list.isEmpty() && (institutionName.contains("IIT") || institutionName.contains("Indian Institute of Technology"))) {
            return courseRepository.findAll().stream()
                    .filter(c -> c.getInstitutionName() == null || c.getInstitutionName().equalsIgnoreCase(institutionName.trim()))
                    .toList();
        }
        return list;
    }

    public List<Course> getCoursesForStudent(String institutionName, User student) {
        List<Course> rawCourses = getCoursesByInstitution(institutionName);
        // Ensure student sees institutional courses as well as global courses
        List<Course> allCourses = courseRepository.findAll();
        List<Course> combined = new ArrayList<>(rawCourses);
        for (Course c : allCourses) {
            if ((c.getInstitutionName() == null || c.getInstitutionName().isBlank()) && combined.stream().noneMatch(existing -> existing.getId().equals(c.getId()))) {
                combined.add(c);
            }
        }

        // Strictly redact all trainer details from course objects for student privacy
        return combined.stream().map(c -> Course.builder()
                .id(c.getId())
                .title(c.getTitle())
                .description(c.getDescription())
                .category(c.getCategory())
                .trainerId(null) // Redacted
                .trainerName(null) // Redacted
                .badgeColor(c.getBadgeColor())
                .institutionId(c.getInstitutionId())
                .institutionName(c.getInstitutionName())
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .enrolledCount(c.getEnrolledCount())
                .progressPercentage(c.getProgressPercentage())
                .createdAt(c.getCreatedAt())
                .build()
        ).toList();
    }

    public List<Course> getTrainerCourses(Long trainerId) {
        return courseRepository.findByTrainerId(trainerId);
    }

    public List<Course> getCoursesForTrainer(Long trainerId) {
        List<Course> primaryCourses = courseRepository.findByTrainerId(trainerId);
        List<CourseTrainer> assignedRelations = courseTrainerRepository.findByTrainerId(trainerId);
        List<Long> extraCourseIds = assignedRelations.stream()
                .map(CourseTrainer::getCourseId)
                .filter(cId -> primaryCourses.stream().noneMatch(c -> c.getId().equals(cId)))
                .toList();

        List<Course> result = new ArrayList<>(primaryCourses);
        if (!extraCourseIds.isEmpty()) {
            List<Course> extraCourses = courseRepository.findAllById(extraCourseIds);
            result.addAll(extraCourses);
        }
        return result;
    }

    public List<CourseTrainer> getTrainersForCourse(Long courseId) {
        Course course = getCourseById(courseId);
        List<CourseTrainer> list = new ArrayList<>(courseTrainerRepository.findByCourseId(courseId));

        // If primary trainer is defined on course but not yet in course_trainers, include them
        if (course.getTrainerId() != null && list.stream().noneMatch(ct -> ct.getTrainerId().equals(course.getTrainerId()))) {
            User primaryUser = userRepository.findById(course.getTrainerId()).orElse(null);
            CourseTrainer primaryCt = CourseTrainer.builder()
                    .courseId(courseId)
                    .trainerId(course.getTrainerId())
                    .trainerName(course.getTrainerName() != null ? course.getTrainerName() : (primaryUser != null ? primaryUser.getFullName() : "Primary Faculty"))
                    .trainerEmail(primaryUser != null ? primaryUser.getEmail() : "")
                    .trainerSpecialization(primaryUser != null && primaryUser.getAssignedSubject() != null ? primaryUser.getAssignedSubject() : (course.getCategory() != null ? course.getCategory() : "Subject Specialist"))
                    .courseTitle(course.getTitle())
                    .assignedAt(course.getCreatedAt())
                    .build();
            list.add(0, primaryCt);
        }

        // Enrich trainerSpecialization from User record if missing
        for (CourseTrainer ct : list) {
            if (ct.getTrainerSpecialization() == null || ct.getTrainerSpecialization().isBlank()) {
                userRepository.findById(ct.getTrainerId()).ifPresent(u -> {
                    ct.setTrainerSpecialization(u.getAssignedSubject() != null ? u.getAssignedSubject() : "Subject Specialist");
                });
            }
        }

        return list;
    }

    public boolean isTrainerAssignedToCourse(Long courseId, Long trainerId) {
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null) return false;
        if (course.getTrainerId() != null && course.getTrainerId().equals(trainerId)) {
            return true;
        }
        return courseTrainerRepository.existsByCourseIdAndTrainerId(courseId, trainerId);
    

    }
    @Transactional
    public List<CourseTrainer> assignTrainersToCourse(Long courseId, List<Long> trainerIds) {
        Course course = getCourseById(courseId);
        List<CourseTrainer> existing = courseTrainerRepository.findByCourseId(courseId);
        courseTrainerRepository.deleteAll(existing);
        courseTrainerRepository.flush();

        List<CourseTrainer> created = new ArrayList<>();
        for (Long tId : trainerIds) {
            User trainer = userRepository.findById(tId).orElse(null);
            if (trainer != null) {
                String spec = trainer.getAssignedSubject() != null ? trainer.getAssignedSubject() : "Subject Specialist";
                CourseTrainer ct = CourseTrainer.builder()
                        .courseId(courseId)
                        .trainerId(trainer.getId())
                        .trainerName(trainer.getFullName())
                        .trainerEmail(trainer.getEmail())
                        .trainerSpecialization(spec)
                        .courseTitle(course.getTitle())
                        .assignedAt(LocalDateTime.now())
                        .build();
                created.add(courseTrainerRepository.save(ct));
            }
        }

        // Also ensure primary trainer on course is set if empty or in the list
        if (!created.isEmpty() && (course.getTrainerId() == null || trainerIds.contains(course.getTrainerId()))) {
            if (course.getTrainerId() == null) {
                course.setTrainerId(created.get(0).getTrainerId());
                course.setTrainerName(created.get(0).getTrainerName());
                courseRepository.save(course);
            }
        }
        return created;
    

    }
    @Transactional
    public List<CourseTrainer> assignCoursesToTrainer(Long trainerId, List<Long> courseIds) {
        User trainer = userRepository.findById(trainerId)
                .orElseThrow(() -> new IllegalArgumentException("Trainer not found with id: " + trainerId));
        List<CourseTrainer> existing = courseTrainerRepository.findByTrainerId(trainerId);
        courseTrainerRepository.deleteAll(existing);
        courseTrainerRepository.flush();

        String spec = trainer.getAssignedSubject() != null ? trainer.getAssignedSubject() : "Subject Specialist";
        List<CourseTrainer> created = new ArrayList<>();
        for (Long cId : courseIds) {
            Course course = courseRepository.findById(cId).orElse(null);
            if (course != null) {
                CourseTrainer ct = CourseTrainer.builder()
                        .courseId(course.getId())
                        .trainerId(trainer.getId())
                        .trainerName(trainer.getFullName())
                        .trainerEmail(trainer.getEmail())
                        .trainerSpecialization(spec)
                        .courseTitle(course.getTitle())
                        .assignedAt(LocalDateTime.now())
                        .build();
                created.add(courseTrainerRepository.save(ct));
            }
        }
        return created;
    }

    public Course getCourseById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Course not found with id: " + id));
    

    }
    @Transactional
    public Course createCourse(Course course) {
        course.setCreatedAt(LocalDateTime.now());
        return courseRepository.save(course);
    

    }
    @Transactional
    public CourseModule addModule(CourseModule module) {
        module.setCreatedAt(LocalDateTime.now());
        return moduleRepository.save(module);
    }

    public List<CourseModule> getCourseModules(Long courseId) {
        return moduleRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
    

    }
    @Transactional
    public ResourceItem addResource(ResourceItem resource) {
        resource.setCreatedAt(LocalDateTime.now());
        return resourceRepository.save(resource);
    }

    public List<ResourceItem> getCourseResources(Long courseId) {
        return resourceRepository.findByCourseIdOrderByOrderIndexAscCreatedAtAsc(courseId);
    }

    public List<ResourceItem> getModuleResources(Long moduleId) {
        return resourceRepository.findByModuleIdOrderByOrderIndexAscCreatedAtAsc(moduleId);
    }

    public CourseDetailDto getCourseFullDetail(Long courseId) {
        return getCourseFullDetail(courseId, null);
    }

    public CourseDetailDto getCourseFullDetail(Long courseId, User currentUser) {
        Course rawCourse = getCourseById(courseId);
        if (currentUser != null && currentUser.getRole() != Role.ROLE_BOSS_ADMIN) {
            institutionSecurityUtils.assertInstitutionAccess(currentUser, rawCourse.getInstitutionId(), rawCourse.getInstitutionName());
        }
        boolean isStudent = (currentUser != null && currentUser.getRole() == Role.ROLE_STUDENT);

        List<CourseModule> modules = moduleRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
        List<ModuleWithResourcesDto> moduleList = new ArrayList<>();

        for (CourseModule mod : modules) {
            List<ResourceItem> rawRes = resourceRepository.findByModuleIdOrderByOrderIndexAscCreatedAtAsc(mod.getId());
            List<ResourceItem> filteredRes = new ArrayList<>();

            for (ResourceItem r : rawRes) {
                // Check if user has access to resource (global study material vs institution-specific material)
                if (!institutionSecurityUtils.canAccessResource(currentUser, r)) {
                    continue;
                }

                if (isStudent) {
                    // Create sanitized copy without trainer details
                    ResourceItem sanitized = ResourceItem.builder()
                            .id(r.getId())
                            .courseId(r.getCourseId())
                            .moduleId(r.getModuleId())
                            .title(r.getTitle())
                            .resourceType(r.getResourceType())
                            .urlOrPath(r.getUrlOrPath())
                            .fileSize(r.getFileSize())
                            .description(r.getDescription())
                            .richContent(r.getRichContent())
                            .videoEmbedUrl(r.getVideoEmbedUrl())
                            .imageUrls(r.getImageUrls())
                            .orderIndex(r.getOrderIndex())
                            .visibilityScope(r.getVisibilityScope())
                            .institutionId(r.getInstitutionId())
                            .institutionName(r.getInstitutionName())
                            .uploaderTrainerId(null) // Redacted
                            .uploaderTrainerName(null) // Redacted
                            .createdAt(r.getCreatedAt())
                            .build();
                    filteredRes.add(sanitized);
                } else {
                    filteredRes.add(r);
                }
            }

            Exam moduleExam = examRepository.findFirstByCourseIdAndModuleId(courseId, mod.getId()).orElse(null);
            int qCount = (moduleExam != null) ? questionRepository.findByExamId(moduleExam.getId()).size() : 0;
            if (isStudent && moduleExam != null) {
                moduleExam = Exam.builder()
                        .id(moduleExam.getId())
                        .courseId(moduleExam.getCourseId())
                        .moduleId(moduleExam.getModuleId())
                        .title(moduleExam.getTitle())
                        .description(moduleExam.getDescription())
                        .instructions(moduleExam.getInstructions())
                        .trainerId(null) // Redacted
                        .trainerName(null) // Redacted
                        .durationMinutes(moduleExam.getDurationMinutes())
                        .totalMarks(moduleExam.getTotalMarks())
                        .passingPercentage(moduleExam.getPassingPercentage())
                        .maxViolations(moduleExam.getMaxViolations())
                        .active(moduleExam.isActive())
                        .randomizeQuestions(moduleExam.isRandomizeQuestions())
                        .createdAt(moduleExam.getCreatedAt())
                        .build();
            }

            moduleList.add(ModuleWithResourcesDto.builder()
                    .module(mod)
                    .resources(filteredRes)
                    .moduleExam(moduleExam)
                    .questionCount(qCount)
                    .build());
        }

        int assignmentCount = assignmentRepository.findByCourseId(courseId).size();
        int liveSessionCount = liveSessionRepository.findByCourseId(courseId).size();
        List<CourseTrainer> trainers = isStudent ? List.of() : getTrainersForCourse(courseId);
        Exam courseExam = examRepository.findFirstByCourseId(courseId).orElse(null);
        int totalExamQuestions = (courseExam != null) ? questionRepository.findByExamId(courseExam.getId()).size() : 0;

        Course processedCourse = rawCourse;
        if (isStudent) {
            processedCourse = Course.builder()
                    .id(rawCourse.getId())
                    .title(rawCourse.getTitle())
                    .description(rawCourse.getDescription())
                    .category(rawCourse.getCategory())
                    .trainerId(null) // Redacted
                    .trainerName(null) // Redacted
                    .badgeColor(rawCourse.getBadgeColor())
                    .institutionId(rawCourse.getInstitutionId())
                    .institutionName(rawCourse.getInstitutionName())
                    .startDate(rawCourse.getStartDate())
                    .endDate(rawCourse.getEndDate())
                    .enrolledCount(rawCourse.getEnrolledCount())
                    .progressPercentage(rawCourse.getProgressPercentage())
                    .createdAt(rawCourse.getCreatedAt())
                    .build();
            if (courseExam != null) {
                courseExam = Exam.builder()
                        .id(courseExam.getId())
                        .courseId(courseExam.getCourseId())
                        .title(courseExam.getTitle())
                        .description(courseExam.getDescription())
                        .instructions(courseExam.getInstructions())
                        .trainerId(null) // Redacted
                        .trainerName(null) // Redacted
                        .durationMinutes(courseExam.getDurationMinutes())
                        .totalMarks(courseExam.getTotalMarks())
                        .passingPercentage(courseExam.getPassingPercentage())
                        .maxViolations(courseExam.getMaxViolations())
                        .active(courseExam.isActive())
                        .randomizeQuestions(courseExam.isRandomizeQuestions())
                        .createdAt(courseExam.getCreatedAt())
                        .build();
            }
        }

        return CourseDetailDto.builder()
                .course(processedCourse)
                .modules(moduleList)
                .assignmentCount(assignmentCount)
                .liveSessionCount(liveSessionCount)
                .assignedTrainers(trainers)
                .courseExam(courseExam)
                .totalExamQuestions(totalExamQuestions)
                .build();
    

    }
    @Transactional
    public java.util.Map<String, Object> saveStudyMaterialWithTest(Long courseId, StudyMaterialUploadDto dto, Long trainerId, String trainerName, String ip) {
        if (dto.getTitle() == null || dto.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Study material title cannot be empty");
        }
        if (dto.getModuleId() == null) {
            throw new IllegalArgumentException("Module selection is required");
        }

        Long trainerInstId = null;
        String trainerInstName = null;
        if (trainerId != null) {
            User trainerUser = userRepository.findById(trainerId).orElse(null);
            if (trainerUser != null) {
                trainerInstId = trainerUser.getInstitutionId();
                trainerInstName = trainerUser.getInstitutionName();
            }
        }
        if (trainerInstName == null || trainerInstName.isBlank()) {
            Course c = courseRepository.findById(courseId).orElse(null);
            if (c != null) {
                trainerInstId = c.getInstitutionId();
                trainerInstName = c.getInstitutionName();
            }
        }

        // Determine visibilityScope: GLOBAL, INSTITUTION, BOTH
        String scope = dto.getVisibilityScope();
        if (scope == null || scope.isBlank()) {
            boolean isGlob = Boolean.TRUE.equals(dto.getIsGlobal());
            boolean isInst = Boolean.TRUE.equals(dto.getIsInstitution());
            if (isGlob && isInst) {
                scope = "BOTH";
            } else if (isGlob) {
                scope = "GLOBAL";
            } else if (isInst) {
                scope = "INSTITUTION";
            } else {
                scope = "BOTH";
            }
        } else {
            scope = scope.toUpperCase().trim();
        }

        ResourceItem resource = ResourceItem.builder()
                .courseId(courseId)
                .moduleId(dto.getModuleId())
                .title(dto.getTitle().trim())
                .resourceType(dto.getResourceType() != null ? dto.getResourceType() : "ARTICLE")
                .urlOrPath(dto.getUrlOrPath() != null ? dto.getUrlOrPath() : "#")
                .fileSize(dto.getFileSize())
                .description(dto.getDescription())
                .richContent(dto.getRichContent())
                .videoEmbedUrl(dto.getVideoEmbedUrl())
                .imageUrls(dto.getImageUrls())
                .orderIndex(dto.getOrderIndex())
                .visibilityScope(scope)
                .institutionId(trainerInstId)
                .institutionName(trainerInstName)
                .uploaderTrainerId(trainerId)
                .uploaderTrainerName(trainerName)
                .createdAt(LocalDateTime.now())
                .build();

        ResourceItem savedResource = resourceRepository.save(resource);

        Exam savedExam = null;
        int questionsAdded = 0;

        if (dto.isIncludeModuleTest() || (dto.getQuestions() != null && !dto.getQuestions().isEmpty())) {
            Exam exam = examRepository.findFirstByCourseIdAndModuleId(courseId, dto.getModuleId()).orElse(null);
            CourseModule module = moduleRepository.findById(dto.getModuleId()).orElse(null);
            String moduleTitle = module != null ? module.getTitle() : "Module Assessment";

            String testTitle = (dto.getTestTitle() != null && !dto.getTestTitle().trim().isEmpty())
                    ? dto.getTestTitle().trim()
                    : moduleTitle + " - Comprehensive Knowledge Assessment";

            int duration = dto.getDurationMinutes() > 0 ? dto.getDurationMinutes() : 20;
            int passingPct = dto.getPassingPercentage() > 0 ? dto.getPassingPercentage() : 60;

            int enforcedStrikes = 3;
            if (trainerInstId != null) {
                enforcedStrikes = institutionRepository.findById(trainerInstId)
                        .map(com.bridgeai.portal.model.Institution::getMaxStrikesAllowed)
                        .filter(m -> m > 0).orElse(3);
            } else if (trainerInstName != null && !trainerInstName.isBlank()) {
                enforcedStrikes = institutionRepository.findByName(trainerInstName.trim())
                        .map(com.bridgeai.portal.model.Institution::getMaxStrikesAllowed)
                        .filter(m -> m > 0).orElse(3);
            }

            if (exam == null) {
                exam = Exam.builder()
                        .courseId(courseId)
                        .moduleId(dto.getModuleId())
                        .title(testTitle)
                        .description(dto.getTestDescription() != null ? dto.getTestDescription() : "Knowledge check and module self-assessment practice questions curated by your faculty.")
                        .instructions("Module self-assessment test. Complete all multiple-choice questions to evaluate your understanding. Multiple practice attempts are permitted.")
                        .trainerId(trainerId)
                        .trainerName(trainerName)
                        .institutionId(trainerInstId)
                        .institutionName(trainerInstName)
                        .assessmentType("SELF_ASSESSMENT")
                        .allowMultipleAttempts(true)
                        .durationMinutes(duration)
                        .passingPercentage(passingPct)
                        .maxViolations(enforcedStrikes)
                        .totalMarks(100)
                        .active(true)
                        .randomizeQuestions(true)
                        .createdAt(LocalDateTime.now())
                        .build();
            } else {
                exam.setTitle(testTitle);
                exam.setDurationMinutes(duration);
                exam.setPassingPercentage(passingPct);
                exam.setAssessmentType("SELF_ASSESSMENT");
                exam.setAllowMultipleAttempts(true);
                exam.setMaxViolations(enforcedStrikes);
                if (trainerInstId != null) exam.setInstitutionId(trainerInstId);
                if (trainerInstName != null) exam.setInstitutionName(trainerInstName);
                if (trainerName != null) exam.setTrainerName(trainerName);
                if (trainerId != null) exam.setTrainerId(trainerId);
            }

            savedExam = examRepository.save(exam);

            if (dto.getQuestions() != null && !dto.getQuestions().isEmpty()) {
                for (CreateQuestionDto qDto : dto.getQuestions()) {
                    if (qDto.getQuestionText() != null && !qDto.getQuestionText().trim().isEmpty()) {
                        ExamQuestion q = ExamQuestion.builder()
                                .examId(savedExam.getId())
                                .questionText(qDto.getQuestionText().trim())
                                .optionA(qDto.getOptionA())
                                .optionB(qDto.getOptionB())
                                .optionC(qDto.getOptionC())
                                .optionD(qDto.getOptionD())
                                .correctOption(ExamQuestion.normalizeCorrectOption(qDto.getCorrectOption(), qDto.getOptionA(), qDto.getOptionB(), qDto.getOptionC(), qDto.getOptionD()))
                                .marks(qDto.getMarks() > 0 ? qDto.getMarks() : 10)
                                .explanation(qDto.getExplanation())
                                .build();
                        questionRepository.save(q);
                        questionsAdded++;
                    }
                }

                List<ExamQuestion> allExamQuestions = questionRepository.findByExamId(savedExam.getId());
                int sumMarks = allExamQuestions.stream().mapToInt(ExamQuestion::getMarks).sum();
                savedExam.setTotalMarks(sumMarks > 0 ? sumMarks : 100);
                savedExam = examRepository.save(savedExam);
            }

            if (auditLogService != null) {
                auditLogService.log(trainerName != null ? trainerName : "Trainer", "TRAINER", "MODULE_TEST_PUBLISHED", "Exam",
                        savedExam.getId(), "Published module assessment test '" + savedExam.getTitle() + "' with " + questionsAdded + " questions", ip);
            }
        }

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("resource", savedResource);
        result.put("exam", savedExam);
        result.put("questionsAdded", questionsAdded);
        return result;
    }


    @Transactional
    public Course updateCourse(Long courseId, Course course) {
        Course existing = getCourseById(courseId);
        if (course.getTitle() != null && !course.getTitle().isBlank()) {
            existing.setTitle(course.getTitle().trim());
        }
        if (course.getDescription() != null) {
            existing.setDescription(course.getDescription().trim());
        }
        if (course.getCategory() != null) {
            existing.setCategory(course.getCategory().trim());
        }

        return courseRepository.save(existing);
    

    }
    @Transactional
    public void deleteCourse(Long courseId) {
        List<CourseModule> modules = moduleRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
        for (CourseModule m : modules) {
            resourceRepository.deleteAll(resourceRepository.findByModuleId(m.getId()));
        }
        moduleRepository.deleteAll(modules);
        resourceRepository.deleteAll(resourceRepository.findByCourseId(courseId));
        courseTrainerRepository.deleteAll(courseTrainerRepository.findByCourseId(courseId));
        courseRepository.deleteById(courseId);
    

    }
    @Transactional
    public CourseModule updateModule(Long moduleId, CourseModule module) {
        CourseModule existing = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new IllegalArgumentException("Module not found: " + moduleId));
        if (module.getTitle() != null && !module.getTitle().isBlank()) {
            existing.setTitle(module.getTitle().trim());
        }
        if (module.getDescription() != null) {
            existing.setDescription(module.getDescription().trim());
        }
        if (module.getOrderIndex() > 0) {
            existing.setOrderIndex(module.getOrderIndex());
        }
        return moduleRepository.save(existing);
    

    }
    @Transactional
    public void deleteModule(Long moduleId) {
        resourceRepository.deleteAll(resourceRepository.findByModuleId(moduleId));
        moduleRepository.deleteById(moduleId);
    

    }
    @Transactional
    public ResourceItem updateResource(Long resourceId, StudyMaterialUploadDto dto) {
        ResourceItem existing = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new IllegalArgumentException("Resource not found: " + resourceId));
        if (dto.getTitle() != null && !dto.getTitle().isBlank()) {
            existing.setTitle(dto.getTitle().trim());
        }
        if (dto.getDescription() != null) {
            existing.setDescription(dto.getDescription().trim());
        }
        if (dto.getResourceType() != null) {
            existing.setResourceType(dto.getResourceType().trim());
        }
        if (dto.getUrlOrPath() != null) {
            existing.setUrlOrPath(dto.getUrlOrPath().trim());
        }
        if (dto.getRichContent() != null) {
            existing.setRichContent(dto.getRichContent());
        }
        return resourceRepository.save(existing);
    

    }
    @Transactional
    public void deleteResource(Long resourceId) {
        resourceRepository.deleteById(resourceId);
    }
}
