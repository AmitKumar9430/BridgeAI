package com.bridgeai.portal.service;

import com.bridgeai.portal.dto.AuthDtos.OtpDispatchPayload;
import com.bridgeai.portal.model.OtpToken;
import com.bridgeai.portal.repository.OtpTokenRepository;
import com.bridgeai.portal.service.strategy.NotificationDispatcher;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private final OtpTokenRepository otpTokenRepository;
    private final NotificationDispatcher notificationDispatcher;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public OtpDispatchPayload generateAndDispatchOtp(String email, String recipientName, String purpose) {
        // Generate 6 digit numeric code
        int codeInt = 100000 + secureRandom.nextInt(900000);
        String otpCode = String.valueOf(codeInt);

        // Store OTP valid for 5 minutes
        OtpToken token = OtpToken.builder()
                .email(email.trim().toLowerCase())
                .otpCode(otpCode)
                .purpose(purpose.toUpperCase())
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .verified(false)
                .build();

        otpTokenRepository.save(token);
        log.info("OTP generated for {} with purpose {} (Expires in 5 mins)", email, purpose);

        // Dispatch via strategy (EmailJS)
        return notificationDispatcher.dispatchOtp(email, recipientName, otpCode, purpose);
    }

    @Transactional
    public boolean verifyOtp(String email, String otpCode, String purpose) {
        String cleanEmail = email.trim().toLowerCase();
        String cleanPurpose = purpose.toUpperCase();

        var opt = otpTokenRepository.findTopByEmailAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(cleanEmail, cleanPurpose);
        if (opt.isEmpty()) {
            log.warn("No active unverified OTP found for {} and purpose {}", cleanEmail, cleanPurpose);
            return false;
        }

        OtpToken token = opt.get();
        if (token.isExpired()) {
            log.warn("OTP for {} is expired", cleanEmail);
            return false;
        }

        if (!token.getOtpCode().equals(otpCode.trim())) {
            log.warn("OTP mismatch for {}", cleanEmail);
            return false;
        }

        token.setVerified(true);
        otpTokenRepository.save(token);
        log.info("OTP successfully verified for {} (purpose: {})", cleanEmail, cleanPurpose);
        return true;
    }
}
