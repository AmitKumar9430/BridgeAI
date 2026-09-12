package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.ResourceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceItemRepository extends JpaRepository<ResourceItem, Long> {
    List<ResourceItem> findByCourseId(Long courseId);
    List<ResourceItem> findByModuleId(Long moduleId);
    List<ResourceItem> findByCourseIdOrderByOrderIndexAscCreatedAtAsc(Long courseId);
    List<ResourceItem> findByModuleIdOrderByOrderIndexAscCreatedAtAsc(Long moduleId);
}
