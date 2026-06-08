import { Resend } from 'resend';

/**
 * Modular Notification Service for HampiStays
 *
 * Architecture:
 *  - In-App (DB): Synchronous primary channel. Always attempted first.
 *  - Email:       Background channel. Always queued via waitUntil — NEVER blocks response.
 *  - Future:      Replace waitUntil with Cloudflare Queue binding for guaranteed delivery.
 *
 * Failure Isolation: Email failures NEVER affect in-app notification delivery.
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
 * Dispatch an email as a background task.
 * Uses ctx.waitUntil for Cloudflare Workers (fire-and-forget, non-blocking).
 * Falls back gracefully for local dev / non-CF environments.
 *
 * Future upgrade path: replace this with a Cloudflare Queue .send() call for
 * guaranteed at-least-once delivery, retries, and dead-letter support.
 */
const dispatchEmail = ({ ctx, resend, payload }) => {
  const emailPromise = resend.emails.send(payload).catch((err) => {
    console.error('[NOTIFICATION_SERVICE] Email dispatch failed (non-critical):', err.message);
  });

  if (ctx?.waitUntil) {
    // Cloudflare Workers: register as background task — response is NOT delayed
    ctx.waitUntil(emailPromise);
  } else {
    // Local dev or fallback: fire-and-forget without blocking
    emailPromise.catch(() => {});
  }
};

/**
 * Main notification dispatcher
 *
 * @param {Object} prisma           - Prisma client instance
 * @param {Object} opts
 * @param {string}  opts.userId       - Recipient user ID (required for in-app)
 * @param {string}  [opts.userEmail]  - Recipient email (required to send email)
 * @param {string}  opts.title        - Notification title
 * @param {string}  opts.message      - Notification body
 * @param {string}  opts.type         - Notification type (e.g. 'booking', 'kyc', 'payment')
 * @param {boolean} [opts.sendEmail]  - Whether to send an email notification
 * @param {string}  [opts.emailSubject] - Email subject line override
 * @param {string}  [opts.emailHtml]  - Email body HTML override
 * @param {Object}  opts.env          - Cloudflare env bindings
 * @param {Object}  [opts.ctx]        - Cloudflare execution context (for waitUntil)
 */
export const sendNotification = async (prisma, {
  userId,
  userEmail,
  title,
  message,
  type,
  sendEmail = false,
  emailSubject = null,
  emailHtml = null,
  env,
  ctx
}) => {
  let notification = null;

  // --- CHANNEL 1: In-App Notification (Primary, Synchronous) ---
  // Most critical channel. Isolated so DB failures don't prevent email from being queued.
  try {
    notification = await prisma.notification.create({
      data: { userId, title, message, type }
    });
  } catch (dbErr) {
    // Log but never rethrow — callers must not fail due to a notification write failure
    console.error('[NOTIFICATION_SERVICE] In-app DB write failed:', dbErr.message, { userId, type });
  }

  // --- CHANNEL 2: Email Notification (Background, Non-Blocking) ---
  // Always dispatched via waitUntil — NEVER holds up the HTTP response.
  if (sendEmail && userEmail && env?.RESEND_API_KEY) {
    try {
      const resend = new Resend(env.RESEND_API_KEY);
      const emailFrom = env.EMAIL_FROM || 'onboarding@resend.dev';
      const finalSubject = emailSubject || title;
      const finalHtml = getEmailTemplate(finalSubject, emailHtml || `<p>${message}</p>`);

      dispatchEmail({
        ctx,
        resend,
        payload: {
          from: emailFrom,
          to: userEmail,
          subject: finalSubject,
          html: finalHtml
        }
      });
    } catch (emailErr) {
      // Sync setup errors (e.g. bad API key format) must not propagate to caller
      console.error('[NOTIFICATION_SERVICE] Email setup failed (non-critical):', emailErr.message);
    }
  }

  return notification;
};

/**
 * Convenience helper: send the same notification to multiple users at once.
 * Each dispatch is fully isolated — one failure does not abort the rest.
 *
 * @param {Object}   prisma      - Prisma client instance
 * @param {Array}    recipients  - Array of { userId, userEmail } objects
 * @param {Object}   opts        - Shared { title, message, type, env, ctx }
 */
export const sendBulkNotification = async (prisma, recipients, { title, message, type, env, ctx }) => {
  const results = await Promise.allSettled(
    recipients.map((r) =>
      sendNotification(prisma, {
        userId: r.userId,
        userEmail: r.userEmail,
        title,
        message,
        type,
        sendEmail: !!r.userEmail,
        env,
        ctx
      })
    )
  );

  const failedCount = results.filter((r) => r.status === 'rejected').length;
  if (failedCount > 0) {
    console.error(`[NOTIFICATION_SERVICE] ${failedCount}/${recipients.length} bulk notifications failed.`);
  }

  return results;
};
