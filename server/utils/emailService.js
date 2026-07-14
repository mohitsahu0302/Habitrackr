const axios = require('axios');

/**
 * Sends an email via the EmailJS REST API ("strict mode" server-side send).
 * Docs: https://www.emailjs.com/docs/rest-api/send/
 * Requires EMAILJS_PRIVATE_KEY (enable in EmailJS dashboard > Account > Security).
 *
 * Your EmailJS template should include variables: {{to_email}}, {{to_name}},
 * {{subject}}, {{message}} (map these in the EmailJS template editor).
 */
async function sendEmail({ toEmail, toName, subject, message, templateParamsExtra = {} }) {
  const { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY } = process.env;

  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    console.warn('[emailService] EmailJS env vars not fully configured — skipping email send.');
    return { skipped: true };
  }

  const payload = {
    service_id: EMAILJS_SERVICE_ID,
    template_id: EMAILJS_TEMPLATE_ID,
    user_id: EMAILJS_PUBLIC_KEY,
    accessToken: EMAILJS_PRIVATE_KEY || undefined,
    template_params: {
      to_email: toEmail,
      to_name: toName,
      subject,
      message,
      ...templateParamsExtra
    }
  };

  try {
    const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    return { success: true, status: response.status };
  } catch (err) {
    console.error('[emailService] Failed to send email:', err.response?.data || err.message);
    return { success: false, error: err.response?.data || err.message };
  }
}

module.exports = { sendEmail };
