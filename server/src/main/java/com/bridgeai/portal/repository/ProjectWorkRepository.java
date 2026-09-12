package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.ProjectWork;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectWorkRepository extends JpaRepository<ProjectWork, Long> {
    List<ProjectWork> findByCourseId(Long courseId);
    List<ProjectWork> findByStudentId(Long studentId);
    List<ProjectWork> findByTrainerId(Long trainerId);
    List<ProjectWork> findBySubjectName(String subjectName);
    List<ProjectWork> findByInstitutionName(String institutionName);
    List<ProjectWork> findByAvailableForSelectionTrue();
}
