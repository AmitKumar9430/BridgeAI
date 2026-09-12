package com.bridgeai.portal.service.strategy;

import com.bridgeai.portal.dto.AuthDtos.OtpDispatchPayload;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class EmailJsDispatcher implements NotificationDispatcher {

    private static final Logger log = LoggerFactory.getLogger(EmailJsDispatcher.class);

    @Value("${app.emailjs.service-id:service_u63zkza}")
    private String serviceId;

    @Value("${app.emailjs.template-id:template_ftzgvwc}")
    private String templateId;

    @Value("${app.emailjs.public-key:udHNyzfgZadsOjR97}")
    private String publicKey;

    @Override
    public boolean supports(String channel) {
        return "EMAILJS".equalsIgnoreCase(channel) || channel == null;
    }

    @Override
    public OtpDispatchPayload dispatchOtp(String recipientEmail, String recipientName, String otpCode, String purpose) {
        Map<String, Object> templateParams = new HashMap<>();
        templateParams.put("to_email", recipientEmail);
        templateParams.put("email", recipientEmail);
        templateParams.put("user_email", recipientEmail);
        templateParams.put("recipient", recipientEmail);
        String name = recipientName != null && !recipientName.isBlank() ? recipientName : recipientEmail;
        templateParams.put("to_name", name);
        templateParams.put("name", name);
        templateParams.put("otp_code", otpCode);
        templateParams.put("passcode", otpCode);
        templateParams.put("otp", otpCode);
        templateParams.put("code", otpCode);
        templateParams.put("purpose", purpose);
        templateParams.put("app_name", "BridgeAI Training & Examination Portal");

        log.info("DISPATCH: Prepared EmailJS OTP [{}] for {} (Purpose: {})", otpCode, recipientEmail, purpose);

        return OtpDispatchPayload.builder()
                .serviceId(serviceId)
                .templateId(templateId)
                .publicKey(publicKey)
                .otpCode(otpCode)
                .templateParams(templateParams)
                .build();
    }
}
