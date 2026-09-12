import emailjs from '@emailjs/browser';

export const EMAILJS_CONFIG = {
  serviceId: 'service_u63zkza',
  templateId: 'template_ftzgvwc',
  publicKey: 'udHNyzfgZadsOjR97',
};

// Initialize EmailJS SDK
emailjs.init({
  publicKey: EMAILJS_CONFIG.publicKey,
});

/**
 * Dispatch verification OTP to user's inbox via EmailJS
 * @param {string} toEmail - Recipient email
 * @param {string} toName - Recipient name
 * @param {string} otpCode - 6-digit numeric OTP
 * @param {string} purpose - REGISTRATION, LOGIN, or FORGOT_PASSWORD
 */
export async function sendOtpEmail(toEmail, toName, otpCode, purpose = 'REGISTRATION') {
  const templateParams = {
    to_email: toEmail,
    email: toEmail,
    user_email: toEmail,
    recipient: toEmail,
    to_name: toName || toEmail.split('@')[0],
    name: toName || toEmail.split('@')[0],
    otp_code: otpCode,
    passcode: otpCode,
    otp: otpCode,
    code: otpCode,
    purpose: purpose,
    app_name: 'BridgeAI Training & Examination Portal',
    time: new Date().toLocaleTimeString(),
  };

  try {
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );
    console.log('[EmailJS] OTP sent successfully:', response.status, response.text);
    return { success: true, response };
  } catch (error) {
    console.warn('[EmailJS] Dispatch notice:', error);
    // Return friendly status so the user can test seamlessly even if template variables differ
    return { success: false, error };
  }
}
