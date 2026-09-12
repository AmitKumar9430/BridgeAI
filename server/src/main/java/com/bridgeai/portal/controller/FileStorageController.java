package com.bridgeai.portal.controller;

import com.bridgeai.portal.model.StoredFile;
import com.bridgeai.portal.model.User;
import com.bridgeai.portal.repository.UserRepository;
import com.bridgeai.portal.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j
public class FileStorageController {

    private final FileStorageService fileStorageService;
    private final UserRepository userRepository;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", required = false) String category,
            Authentication auth) {
        try {
            Long userId = null;
            String userName = "Anonymous";
            if (auth != null && auth.getName() != null) {
                User user = userRepository.findByEmail(auth.getName()).orElse(null);
                if (user != null) {
                    userId = user.getId();
                    userName = user.getFullName();
                }
            }

            StoredFile stored = fileStorageService.storeFile(file, category, userId, userName);

            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("fileId", stored.getId());
            resp.put("fileName", stored.getFileName());
            resp.put("fileSize", stored.getFileSize());
            resp.put("fileType", stored.getFileType());
            resp.put("category", stored.getCategory());
            resp.put("downloadUrl", "/api/files/download/" + stored.getId());
            resp.put("viewUrl", "/api/files/view/" + stored.getId());

            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (Exception e) {
            log.error("Failed to upload file to Aiven MySQL: {}", e.getMessage(), e);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Failed to upload and persist file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long id) {
        StoredFile file = fileStorageService.getFile(id).orElse(null);
        if (file == null) {
            return ResponseEntity.notFound().build();
        }

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(file.getFileType());
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(file.getFileName(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentType(mediaType)
                .contentLength(file.getFileSize() != null ? file.getFileSize() : file.getData().length)
                .body(file.getData());
    }

    @GetMapping("/view/{id}")
    public ResponseEntity<byte[]> viewFile(@PathVariable Long id) {
        StoredFile file = fileStorageService.getFile(id).orElse(null);
        if (file == null) {
            return ResponseEntity.notFound().build();
        }

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(file.getFileType());
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        ContentDisposition disposition = ContentDisposition.inline()
                .filename(file.getFileName(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentType(mediaType)
                .contentLength(file.getFileSize() != null ? file.getFileSize() : file.getData().length)
                .body(file.getData());
    }

    @GetMapping("/info/{id}")
    public ResponseEntity<?> getFileInfo(@PathVariable Long id) {
        StoredFile file = fileStorageService.getFile(id).orElse(null);
        if (file == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("fileId", file.getId());
        resp.put("fileName", file.getFileName());
        resp.put("fileSize", file.getFileSize());
        resp.put("fileType", file.getFileType());
        resp.put("category", file.getCategory());
        resp.put("uploadedAt", file.getUploadedAt());
        resp.put("downloadUrl", "/api/files/download/" + file.getId());
        resp.put("viewUrl", "/api/files/view/" + file.getId());

        return ResponseEntity.ok(resp);
    }
}
