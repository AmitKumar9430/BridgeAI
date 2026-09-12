package com.bridgeai.portal.service.strategy;

import com.bridgeai.portal.dto.AuthDtos.OtpDispatchPayload;

public interface NotificationDispatcher {
    boolean supports(String channel);
    OtpDispatchPayload dispatchOtp(String recipientEmail, String recipientName, String otpCode, String purpose);
}
