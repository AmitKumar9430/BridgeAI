package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.ProjectSelection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectSelectionRepository extends JpaRepository<ProjectSelection, Long> {
    List<ProjectSelection> findByTopicId(Long topicId);
    Optional<ProjectSelection> findByTopicIdAndStudentId(Long topicId, Long studentId);
    List<ProjectSelection> findByStudentId(Long studentId);
}
