package com.bridgeai.portal.controller;

import com.bridgeai.portal.model.Certificate;
import com.bridgeai.portal.model.User;
import com.bridgeai.portal.repository.CertificateRepository;
import com.bridgeai.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateRepository certificateRepository;
    private final UserRepository userRepository;

    @GetMapping("/my")
    public ResponseEntity<List<Certificate>> getMyCertificates(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(certificateRepository.findByStudentId(user.getId()));
    }

    @GetMapping("/verify/{code}")
    public ResponseEntity<?> verifyCertificate(@PathVariable String code) {
        return certificateRepository.findByCertificateCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
