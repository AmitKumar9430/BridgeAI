package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByTrainerId(Long trainerId);
    List<Course> findByInstitutionName(String institutionName);
}
