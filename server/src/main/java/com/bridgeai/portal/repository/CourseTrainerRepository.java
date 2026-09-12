package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.CourseTrainer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseTrainerRepository extends JpaRepository<CourseTrainer, Long> {
    List<CourseTrainer> findByCourseId(Long courseId);
    List<CourseTrainer> findByTrainerId(Long trainerId);
    boolean existsByCourseIdAndTrainerId(Long courseId, Long trainerId);
    void deleteByCourseIdAndTrainerId(Long courseId, Long trainerId);
    void deleteByCourseId(Long courseId);
    void deleteByTrainerId(Long trainerId);
}
