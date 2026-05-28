import { Resend } from 'resend';
import { logSecureError } from '../../logging/logger.js';

export class EmailService {
  constructor(env) {
    this.resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
    this.from = env.EMAIL_FROM || 'noreply@hampistays.com';
  }

  async send(to, subject, html) {
    if (!this.resend) {
      console.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
      return false;
    }

    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html
      });
      return true;
    } catch (err) {
      logSecureError('EMAIL_FAILURE', `Failed to send email to ${to}`, { error: err.message });
      return false;
    }
  }
}
