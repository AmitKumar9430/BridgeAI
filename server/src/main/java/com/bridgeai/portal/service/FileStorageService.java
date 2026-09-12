package com.bridgeai.portal.service;

import com.bridgeai.portal.model.StoredFile;
import com.bridgeai.portal.repository.StoredFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileStorageService {

    private final StoredFileRepository storedFileRepository;

    @Transactional
    public StoredFile storeFile(MultipartFile file, String category, Long userId, String userName) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file");
        }

        String rawFileName = StringUtils.cleanPath(Objects.requireNonNullElse(file.getOriginalFilename(), "unnamed_file"));
        if (rawFileName.contains("..")) {
            throw new IllegalArgumentException("File name contains invalid path sequence: " + rawFileName);
        }

        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank() || contentType.equals("application/octet-stream")) {
            contentType = resolveContentTypeFromFileName(rawFileName);
        }

        StoredFile storedFile = StoredFile.builder()
                .fileName(rawFileName)
                .fileType(contentType)
                .fileSize(file.getSize())
                .data(file.getBytes())
                .category(category != null && !category.isBlank() ? category.trim() : "GENERAL")
                .uploadedById(userId)
                .uploadedByName(userName)
                .uploadedAt(LocalDateTime.now())
                .build();

        StoredFile saved = storedFileRepository.save(storedFile);
        log.info("Persisted file to Aiven MySQL: id={}, name={}, size={} bytes, category={}", 
                saved.getId(), saved.getFileName(), saved.getFileSize(), saved.getCategory());
        return saved;
    }

    @Transactional(readOnly = true)
    public Optional<StoredFile> getFile(Long id) {
        if (id == null) {
            return Optional.empty();
        }
        return storedFileRepository.findById(id);
    }

    @Transactional
    public boolean deleteFile(Long id) {
        if (id != null && storedFileRepository.existsById(id)) {
            storedFileRepository.deleteById(id);
            return true;
        }
        return false;
    }

    private String resolveContentTypeFromFileName(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".zip")) return "application/zip";
        if (lower.endsWith(".rar")) return "application/x-rar-compressed";
        if (lower.endsWith(".tar") || lower.endsWith(".tar.gz") || lower.endsWith(".tgz")) return "application/gzip";
        if (lower.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
        if (lower.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        if (lower.endsWith(".doc")) return "application/msword";
        if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (lower.endsWith(".xls")) return "application/vnd.ms-excel";
        if (lower.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".txt")) return "text/plain";
        return "application/octet-stream";
    }
}
