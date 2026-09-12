package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByCourseId(Long courseId);
    List<Exam> findByCourseIdAndModuleId(Long courseId, Long moduleId);
    java.util.Optional<Exam> findFirstByCourseIdAndModuleId(Long courseId, Long moduleId);
    java.util.Optional<Exam> findFirstByCourseId(Long courseId);
    List<Exam> findByTrainerId(Long trainerId);
    List<Exam> findByInstitutionId(Long institutionId);
    List<Exam> findByInstitutionNameIgnoreCase(String institutionName);
    List<Exam> findByActiveTrue();
}
