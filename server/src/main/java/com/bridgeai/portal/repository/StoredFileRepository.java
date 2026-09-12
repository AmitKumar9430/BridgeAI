package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.StoredFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoredFileRepository extends JpaRepository<StoredFile, Long> {
    List<StoredFile> findByUploadedById(Long uploadedById);
    List<StoredFile> findByCategory(String category);
}
