import { Resend } from 'resend';

/**
 * Modular Notification Service for HampiStays
 * Supports In-App, Email, and prepares architecture for SMS/WhatsApp.
 */

// Premium Email Template wrapper
export const getEmailTemplate = (subject, contentHtml) => `
  <div style="font-family: 'Outfit', sans-serif; background-color: #F5F1E9; padding: 40px 20px; color: #0A1128;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; padding: 40px; border: 1px solid rgba(197, 160, 89, 0.3); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="font-family: serif; color: #0A1128; font-size: 28px; margin: 0;">HampiStays</h2>
        <p style="color: #C5A059; font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; font-weight: bold; margin-top: 5px;">Luxury Partner Network</p>
      </div>
      <h3 style="font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #0A1128;">${subject}</h3>
      <div style="font-size: 14px; line-height: 1.6; color: rgba(10, 17, 40, 0.8); margin-bottom: 30px;">
        ${contentHtml}
      </div>
      <div style="text-align: center; margin-bottom: 30px;">
        <a href="https://hampistays.com/dashboard" style="background-color: #0A1128; color: #F5F1E9; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px rgba(10, 17, 40, 0.2);">
          Open Dashboard
        </a>
      </div>
      <p style="font-size: 12px; color: rgba(10, 17, 40, 0.4); text-align: center;">
        This is an automated message from HampiStays Partner Network.
      </p>
    </div>
  </div>
`;

/**
 * Main notification dispatcher
 */
export const sendNotification = async (prisma, {
  userId,
  userEmail,
  title,
  message,
  type,
  metadata = null,
  sendEmail = false,
  emailSubject = null,
  emailHtml = null,
  env,
  ctx // Cloudflare execution context for background tasks
}) => {
  try {
    // 1. In-App Notification (Database)
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        // If your schema doesn't have metadata yet, we might stringify it to message or ignore
      }
    });

    // Audit Log for In-App Notification
    await logAuditEvent(prisma, {
      userId,
      action: 'NOTIFICATION_SENT',
      details: `Sent ${type} in-app notification: ${title}`,
      ipAddress: 'system'
    });

    // 2. Email Notification
    if (sendEmail && userEmail && env.RESEND_API_KEY) {
      const resend = new Resend(env.RESEND_API_KEY);
      const emailFrom = env.EMAIL_FROM || 'onboarding@resend.dev';
      const finalSubject = emailSubject || title;
      const finalHtml = getEmailTemplate(finalSubject, emailHtml || `<p>${message}</p>`);

      const emailPromise = resend.emails.send({
        from: emailFrom,
        to: userEmail,
        subject: finalSubject,
        html: finalHtml
      }).then(async () => {
        await logAuditEvent(prisma, {
          userId,
          action: 'EMAIL_SENT',
          details: `Sent ${type} email to ${userEmail}`,
          ipAddress: 'system'
        });
      }).catch(async (err) => {
        console.error("Email send failed:", err);
        await logAuditEvent(prisma, {
          userId,
          action: 'EMAIL_FAILED',
          details: `Failed to send ${type} email to ${userEmail}. Error: ${err.message}`,
          ipAddress: 'system'
        });
      });

      if (ctx && ctx.waitUntil) {
        ctx.waitUntil(emailPromise);
      } else {
        await emailPromise;
      }
    }

    // 3. SMS/WhatsApp Hook (Future)
    // if (sendWhatsapp) { dispatchWhatsappWorker(...) }

    return notification;
  } catch (err) {
    console.error("sendNotification Error:", err);
    throw err;
  }
};

const logAuditEvent = async (prisma, { userId, action, details, ipAddress }) => {
  try {
    // Use VerificationAudit or a dedicated AuditLog model depending on schema
    await prisma.verificationAudit.create({
      data: {
        adminId: 'system',
        adminName: 'System Trigger',
        targetUserId: userId,
        targetName: 'User',
        targetType: 'SYSTEM_EVENT',
        action: action,
        previousStatus: null,
        newStatus: null,
        rejectionReason: details,
        ipAddress: ipAddress || 'system',
        userAgent: 'HampiStays Backend Service'
      }
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
};
