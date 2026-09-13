package com.bridgeai.portal.controller;

import com.bridgeai.portal.dto.CourseDtos.CourseDetailDto;
import com.bridgeai.portal.dto.CourseDtos.StudyMaterialUploadDto;
import com.bridgeai.portal.dto.ExamDtos.ScheduleExamRequest;
import com.bridgeai.portal.model.Course;
import com.bridgeai.portal.model.CourseModule;
import com.bridgeai.portal.model.CourseTrainer;
import com.bridgeai.portal.model.ResourceItem;
import com.bridgeai.portal.model.Role;
import com.bridgeai.portal.model.User;
import com.bridgeai.portal.repository.UserRepository;
import com.bridgeai.portal.service.TrainingService;
import com.bridgeai.portal.service.ExamService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final TrainingService trainingService;
    private final ExamService examService;
    private final UserRepository userRepository;
    private final com.bridgeai.portal.security.InstitutionSecurityUtils institutionSecurityUtils;

    @GetMapping
    public ResponseEntity<List<Course>> getAllCourses(
            @RequestParam(required = false) String institutionName,
            Authentication auth) {
        User user = null;
        if (auth != null) {
            user = userRepository.findByEmail(auth.getName()).orElse(null);
        }
        if (user != null) {
            if (user.getRole() == Role.ROLE_STUDENT) {
                return ResponseEntity.ok(trainingService.getCoursesForStudent(user.getInstitutionName(), user));
            } else if (user.getRole() == Role.ROLE_SUPER_ADMIN || user.getRole() == Role.ROLE_TRAINER) {
                return ResponseEntity.ok(trainingService.getCoursesByInstitution(user.getInstitutionName()));
            }
        }
        if (institutionName != null && !institutionName.isBlank()) {
            return ResponseEntity.ok(trainingService.getCoursesByInstitution(institutionName.trim()));
        }
        return ResponseEntity.ok(trainingService.getAllCourses());
    }

    @GetMapping("/my-assigned")
    public ResponseEntity<List<Course>> getMyAssignedCourses(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = userRepository.findByEmail(auth.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // If Boss Admin, return all courses across the portal
        if (user.getRole() == Role.ROLE_BOSS_ADMIN) {
            return ResponseEntity.ok(trainingService.getAllCourses());
        }

        // If Super Admin, strictly return courses belonging to their own institution
        if (user.getRole() == Role.ROLE_SUPER_ADMIN) {
            return ResponseEntity.ok(trainingService.getCoursesByInstitution(user.getInstitutionName()));
        }

        // If Trainer, strictly return only courses assigned to this trainer!
        if (user.getRole() == Role.ROLE_TRAINER) {
            return ResponseEntity.ok(trainingService.getCoursesForTrainer(user.getId()));
        }

        return ResponseEntity.ok(trainingService.getCoursesForStudent(user.getInstitutionName(), user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseDetailDto> getCourseDetail(@PathVariable Long id, Authentication auth) {
        User user = null;
        if (auth != null) {
            user = userRepository.findByEmail(auth.getName()).orElse(null);
        }
        return ResponseEntity.ok(trainingService.getCourseFullDetail(id, user));
    }

    @GetMapping("/{courseId}/trainers")
    public ResponseEntity<List<CourseTrainer>> getCourseTrainers(@PathVariable Long courseId) {
        return ResponseEntity.ok(trainingService.getTrainersForCourse(courseId));
    }

    @PostMapping("/{courseId}/assign-trainers")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<?> assignTrainersToCourse(@PathVariable Long courseId, @RequestBody Map<String, List<Long>> payload) {
        List<Long> trainerIds = payload.get("trainerIds");
        if (trainerIds == null) {
            trainerIds = List.of();
        }
        List<CourseTrainer> result = trainingService.assignTrainersToCourse(courseId, trainerIds);
        return ResponseEntity.ok(Map.of("success", true, "trainers", result));
    }

    @PostMapping("/trainer/{trainerId}/assign-courses")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<?> assignCoursesToTrainer(@PathVariable Long trainerId, @RequestBody Map<String, List<Long>> payload) {
        List<Long> courseIds = payload.get("courseIds");
        if (courseIds == null) {
            courseIds = List.of();
        }
        List<CourseTrainer> result = trainingService.assignCoursesToTrainer(trainerId, courseIds);
        return ResponseEntity.ok(Map.of("success", true, "courses", result));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<Course> createCourse(@RequestBody Course course, Authentication auth) {
        if (auth != null) {
            User user = userRepository.findByEmail(auth.getName()).orElse(null);
            if (user != null) {
                if (user.getRole() != Role.ROLE_BOSS_ADMIN) {
                    course.setInstitutionId(user.getInstitutionId());
                    course.setInstitutionName(user.getInstitutionName());
                }
                if (course.getTrainerId() == null) {
                    course.setTrainerId(user.getId());
                    course.setTrainerName(user.getFullName());
                }
            }
        }
        return ResponseEntity.ok(trainingService.createCourse(course));
    }

    @PostMapping("/{courseId}/modules")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<?> addModule(@PathVariable Long courseId, @RequestBody CourseModule module, Authentication auth) {
        Course course = trainingService.getCourseById(courseId);
        if (auth != null) {
            User user = userRepository.findByEmail(auth.getName()).orElse(null);
            if (user != null) {
                institutionSecurityUtils.assertInstitutionAccess(user, course.getInstitutionId(), course.getInstitutionName());
                if (user.getRole() == Role.ROLE_TRAINER) {
                    boolean isConcernedFaculty = trainingService.isTrainerAssignedToCourse(courseId, user.getId())
                            || (course.getTrainerName() != null && course.getTrainerName().equalsIgnoreCase(user.getFullName()));
                    if (!isConcernedFaculty) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                                "success", false,
                                "error", "Access Denied",
                                "message", "Unauthorized: Modules for subject '" + course.getTitle() + "' can only be created by the concerned faculty (" + (course.getTrainerName() != null ? course.getTrainerName() : "Assigned Trainer") + ")."
                        ));
                    }
                }
            }
        }
        module.setCourseId(courseId);
        return ResponseEntity.ok(trainingService.addModule(module));
    }

    @PostMapping("/{courseId}/resources")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<?> addResource(
            @PathVariable Long courseId,
            @RequestBody StudyMaterialUploadDto dto,
            Authentication auth,
            HttpServletRequest request) {
        Course course = trainingService.getCourseById(courseId);
        Long trainerId = null;
        String trainerName = course.getTrainerName();

        if (auth != null) {
            User user = userRepository.findByEmail(auth.getName()).orElse(null);
            if (user != null) {
                institutionSecurityUtils.assertInstitutionAccess(user, course.getInstitutionId(), course.getInstitutionName());
                trainerId = user.getId();
                trainerName = user.getFullName();
                if (user.getRole() != Role.ROLE_BOSS_ADMIN) {
                    dto.setInstitutionId(user.getInstitutionId());
                    dto.setInstitutionName(user.getInstitutionName());
                }
                if (user.getRole() == Role.ROLE_TRAINER) {
                    boolean isConcernedFaculty = trainingService.isTrainerAssignedToCourse(courseId, user.getId())
                            || (course.getTrainerName() != null && course.getTrainerName().equalsIgnoreCase(user.getFullName()));
                    if (!isConcernedFaculty) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                                "success", false,
                                "error", "Access Denied",
                                "message", "Unauthorized: Study materials for subject '" + course.getTitle() + "' can only be uploaded by the concerned faculty (" + (course.getTrainerName() != null ? course.getTrainerName() : "Assigned Trainer") + ")."
                        ));
                    }
                }
            }
        }

        dto.setCourseId(courseId);
        String ip = request != null ? request.getRemoteAddr() : "127.0.0.1";
        java.util.Map<String, Object> result = trainingService.saveStudyMaterialWithTest(courseId, dto, trainerId, trainerName, ip);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{courseId}/modules/{moduleId}/exam")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<?> createModuleExam(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @RequestBody ScheduleExamRequest examReq,
            Authentication auth,
            HttpServletRequest request) {
        Course course = trainingService.getCourseById(courseId);
        Long trainerId = null;
        String trainerName = course.getTrainerName();

        if (auth != null) {
            User user = userRepository.findByEmail(auth.getName()).orElse(null);
            if (user != null) {
                institutionSecurityUtils.assertInstitutionAccess(user, course.getInstitutionId(), course.getInstitutionName());
                trainerId = user.getId();
                trainerName = user.getFullName();
                if (user.getRole() != Role.ROLE_BOSS_ADMIN) {
                    examReq.setInstitutionId(user.getInstitutionId());
                    examReq.setInstitutionName(user.getInstitutionName());
                }
                if (user.getRole() == Role.ROLE_TRAINER) {
                    boolean isConcernedFaculty = trainingService.isTrainerAssignedToCourse(courseId, user.getId())
                            || (course.getTrainerName() != null && course.getTrainerName().equalsIgnoreCase(user.getFullName()));
                    if (!isConcernedFaculty) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                                "success", false,
                                "error", "Access Denied",
                                "message", "Unauthorized: Module exams for subject '" + course.getTitle() + "' can only be scheduled by the concerned faculty."
                        ));
                    }
                }
            }
        }

        examReq.setCourseId(courseId);
        examReq.setModuleId(moduleId);
        String ip = request != null ? request.getRemoteAddr() : "127.0.0.1";
        return ResponseEntity.ok(examService.scheduleExam(examReq, trainerId, trainerName, ip));
    }

    @PutMapping("/{courseId}")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Course> updateCourse(@PathVariable Long courseId, @RequestBody Course course, Authentication auth) {
        if (auth != null) {
            User user = userRepository.findByEmail(auth.getName()).orElse(null);
            Course existing = trainingService.getCourseById(courseId);
            institutionSecurityUtils.assertInstitutionAccess(user, existing.getInstitutionId(), existing.getInstitutionName());
        }
        return ResponseEntity.ok(trainingService.updateCourse(courseId, course));
    }

    @DeleteMapping("/{courseId}")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long courseId, Authentication auth) {
        if (auth != null) {
            User user = userRepository.findByEmail(auth.getName()).orElse(null);
            Course existing = trainingService.getCourseById(courseId);
            institutionSecurityUtils.assertInstitutionAccess(user, existing.getInstitutionId(), existing.getInstitutionName());
        }
        trainingService.deleteCourse(courseId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/modules/{moduleId}")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<CourseModule> updateModule(@PathVariable Long moduleId, @RequestBody CourseModule module) {
        return ResponseEntity.ok(trainingService.updateModule(moduleId, module));
    }

    @DeleteMapping("/modules/{moduleId}")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<Void> deleteModule(@PathVariable Long moduleId) {
        trainingService.deleteModule(moduleId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/resources/{resourceId}")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<ResourceItem> updateResource(@PathVariable Long resourceId, @RequestBody StudyMaterialUploadDto dto) {
        return ResponseEntity.ok(trainingService.updateResource(resourceId, dto));
    }

    @DeleteMapping("/resources/{resourceId}")
    @PreAuthorize("hasAnyAuthority('ROLE_BOSS_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_TRAINER')")
    public ResponseEntity<Void> deleteResource(@PathVariable Long resourceId) {
        trainingService.deleteResource(resourceId);
        return ResponseEntity.noContent().build();
    }
}
