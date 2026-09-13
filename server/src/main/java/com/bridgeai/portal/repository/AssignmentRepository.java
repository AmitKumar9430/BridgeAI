package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByCourseId(Long courseId);
    List<Assignment> findByTrainerId(Long trainerId);
    List<Assignment> findBySubjectName(String subjectName);
    List<Assignment> findByInstitutionIdOrderByCreatedAtDesc(Long institutionId);
    List<Assignment> findByInstitutionNameOrderByCreatedAtDesc(String institutionName);
    List<Assignment> findByCourseIdAndInstitutionId(Long courseId, Long institutionId);
    List<Assignment> findAllByOrderByCreatedAtDesc();
}
