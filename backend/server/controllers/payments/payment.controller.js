import { verifyPaymentSignature } from '../../services/payments/verification.service.js';
import { logSecureError, logSecureInfo } from '../../logging/logger.js';
import { Resend } from 'resend';
import crypto from 'crypto';
import { sendNotification } from '../../services/notification.service.js';

export const verifyPayment = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  const ref = c.req.param('ref');
  
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }
  
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, creditsToDeduct } = body;
  
  try {
    const isValid = await verifyPaymentSignature(
      crypto, 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      c.env.RAZORPAY_KEY_SECRET
    );

    const booking = await prisma.booking.findUnique({
      where: { referenceNumber: ref },
      include: { 
        user: true, 
        room: true,
        resort: { 
          include: { 
            owner: { 
              include: { user: true } 
            } 
          } 
        } 
      }
    });

    if (!isValid) {
      logSecureError('PAYMENT_VERIFICATION_FAILED', 'Invalid Razorpay Signature', { ref, razorpay_order_id });
      
      // Notify owner of failed payment if booking exists
      if (booking && booking.resort?.owner?.user) {
        await sendNotification(prisma, {
          userId: booking.resort.owner.user.id,
          title: '❌ Payment Failed',
          message: `Payment failed for booking ${ref}. Room inventory remains locked until timeout.`,
          type: 'PAYMENT_FAILED',
          env: c.env,
          ctx: c.executionCtx
        });
      }
      return c.json({ error: 'Invalid signature' }, 400);
    }

    if (!booking) return c.json({ error: 'Booking not found' }, 404);

    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (booking.createdAt < fifteenMinsAgo) {
      logSecureError('PAYMENT_TIMEOUT', 'Payment succeeded but inventory lock expired', { ref });
      await prisma.booking.update({
        where: { referenceNumber: ref },
        data: { 
          status: 'CANCELLED',
          paymentStatus: 'MANUAL_REVIEW_REQUIRED'
        }
      });
      return c.json({ error: 'Payment received but room lock expired. Contact support for refund or reallocation.' }, 400);
    }

    // ATOMIC: Update booking to PAID and create payout record in a single transaction
    // This guarantees: no PAID booking can exist without a corresponding payout record.
    const commissionRate = booking.commissionRate || booking.resort?.commissionRate || 15;
    const grossAmount = booking.totalPrice;
    const platformCommission = Math.round(grossAmount * (commissionRate / 100));
    const netAmount = grossAmount - platformCommission;

    const [updatedBooking] = await prisma.$transaction([
      prisma.booking.update({
        where: { referenceNumber: ref },
        data: { 
          status: 'PAID', 
          paymentStatus: 'PAID',
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id
        }
      }),
      ...(booking.resort?.ownerId ? [prisma.resortOwnerPayout.upsert({
        where: { bookingId: booking.id },
        update: { status: 'PENDING' },
        create: {
          bookingId: booking.id,
          resortId: booking.resort.id,
          ownerId: booking.resort.ownerId,
          grossAmount,
          commissionRate,
          platformCommission,
          netAmount,
          status: 'PENDING'
        }
      })] : [])
    ]);

    // NOTE: Promotion usageCount is already incremented atomically inside createBooking's
    // Serializable transaction. Do NOT increment again here — that caused double-counting.

    // ✅ SAFE: Deduct reward credits ONLY after the atomic booking+payout transaction succeeds.
    // Kept outside the transaction intentionally — credits reconcile manually on failure.
    const creditsAmount = Number(creditsToDeduct) || 0;
    if (creditsAmount > 0 && booking.userId) {
      try {
        await prisma.rewardCredit.create({
          data: {
            userId: booking.userId,
            amount: -creditsAmount,
            source: 'USED_FOR_BOOKING'
          }
        });
        logSecureInfo('CREDITS_DEDUCTED', `Deducted ₹${creditsAmount} credits for booking ${ref}`, { ref });
      } catch (creditErr) {
        logSecureError('CREDITS_DEDUCTION_FAILED', 'Failed to deduct credits post-payment', { ref, error: creditErr.message });
      }
    }


    
    // Traveler Notification
    if (booking.user?.email) {
      const checkInFormatted = new Date(booking.checkIn).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const checkOutFormatted = new Date(booking.checkOut).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const nights = Math.round((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24));

      const travelerHtmlContent = `
        <div style="background:#f7f3ec;padding:20px 0;">
          <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(197,160,89,0.25);box-shadow:0 4px 20px rgba(0,0,0,0.07);">
            <!-- Header -->
            <div style="background:#0A1128;padding:32px 40px;text-align:center;">
              <h1 style="font-family:Georgia,serif;color:#C5A059;font-size:28px;margin:0;letter-spacing:2px;">HAMPISTAYS</h1>
              <p style="color:rgba(255,255,255,0.5);font-size:11px;text-transform:uppercase;letter-spacing:3px;margin:6px 0 0;">Luxury Sanctuary Stays</p>
            </div>
            <!-- Green success banner -->
            <div style="background:#16a34a;padding:14px 40px;text-align:center;">
              <p style="color:#fff;font-size:14px;font-weight:700;margin:0;">✅ Booking Confirmed!</p>
            </div>
            <!-- Body -->
            <div style="padding:36px 40px;">
              <p style="font-family:Arial,sans-serif;font-size:15px;color:#0A1128;margin:0 0 24px;">Dear <strong>${booking.user.name}</strong>,</p>
              <p style="font-family:Arial,sans-serif;font-size:14px;color:#555;line-height:1.6;margin:0 0 28px;">Your stay at <strong>${booking.resort?.name || 'HampiStays'}</strong> is confirmed and we're thrilled to host you. Please find your itinerary below.</p>
              
              <!-- Booking Card -->
              <div style="background:#f7f3ec;border:1px solid rgba(197,160,89,0.3);border-radius:12px;padding:24px;margin-bottom:28px;">
                <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;">
                  <tr><td style="padding:8px 0;color:#888;width:40%;">Booking Reference</td><td style="padding:8px 0;color:#0A1128;font-weight:700;">${ref}</td></tr>
                  <tr><td style="padding:8px 0;color:#888;">Resort</td><td style="padding:8px 0;color:#0A1128;font-weight:600;">${booking.resort?.name || 'N/A'}</td></tr>
                  <tr><td style="padding:8px 0;color:#888;">Room Type</td><td style="padding:8px 0;color:#0A1128;">${booking.room?.name || 'Standard'}</td></tr>
                  <tr><td style="padding:8px 0;color:#888;">Check-In</td><td style="padding:8px 0;color:#0A1128;">${checkInFormatted} &nbsp;·&nbsp; 2:00 PM</td></tr>
                  <tr><td style="padding:8px 0;color:#888;">Check-Out</td><td style="padding:8px 0;color:#0A1128;">${checkOutFormatted} &nbsp;·&nbsp; 11:00 AM</td></tr>
                  <tr><td style="padding:8px 0;color:#888;">Duration</td><td style="padding:8px 0;color:#0A1128;">${nights} Night${nights !== 1 ? 's' : ''}</td></tr>
                  <tr><td style="padding:8px 0;color:#888;">Guests</td><td style="padding:8px 0;color:#0A1128;">${booking.guests}</td></tr>
                  <tr style="border-top:1px solid rgba(197,160,89,0.3);">
                    <td style="padding:12px 0 0;color:#0A1128;font-weight:700;font-size:14px;">Total Paid</td>
                    <td style="padding:12px 0 0;color:#C5A059;font-weight:700;font-size:16px;">₹${booking.totalPrice?.toLocaleString('en-IN')}</td>
                  </tr>
                </table>
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="https://hampistays.com/dashboard/bookings" style="display:inline-block;background:#0A1128;color:#C5A059;padding:14px 32px;border-radius:8px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:1px;">VIEW YOUR QR PASS →</a>
              </div>

              <p style="font-family:Arial,sans-serif;font-size:13px;color:#888;text-align:center;">Your digital check-in QR code is available in your dashboard. Present it at the resort for a seamless check-in experience.</p>
            </div>
            <!-- Footer -->
            <div style="background:#f7f3ec;padding:20px 40px;text-align:center;border-top:1px solid rgba(197,160,89,0.2);">
              <p style="font-family:Arial,sans-serif;font-size:11px;color:#aaa;margin:0;">This is an automated confirmation from HampiStays &nbsp;·&nbsp; <a href="https://hampistays.com" style="color:#C5A059;text-decoration:none;">hampistays.com</a></p>
            </div>
          </div>
        </div>
      `;

      await sendNotification(prisma, {
        userId: booking.user.id,
        userEmail: booking.user.email,
        title: `✅ Booking Confirmed — ${booking.resort?.name || 'HampiStays'}`,
        message: `Your booking for ${booking.room?.name || 'Standard'} is confirmed. Check-in: ${checkInFormatted}.`,
        type: 'BOOKING_CONFIRMED',
        sendEmail: true,
        emailSubject: `🏨 Booking Confirmed — ${ref} | HampiStays`,
        emailHtml: travelerHtmlContent,
        env: c.env,
        ctx: c.executionCtx
      });
    }

    // Owner Notification
    if (booking.resort?.owner?.user) {
      const ownerUser = booking.resort.owner.user;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🏨 New Booking Received</h2>
          <p><strong>Guest Name:</strong> ${booking.user.name}</p>
          <p><strong>Booking ID:</strong> ${ref}</p>
          <p><strong>Room Type:</strong> ${booking.room?.name || 'Standard'}</p>
          <p><strong>Check-In Date:</strong> ${new Date(booking.checkIn).toLocaleDateString()}</p>
          <p><strong>Check-Out Date:</strong> ${new Date(booking.checkOut).toLocaleDateString()}</p>
          <p><strong>Guest Count:</strong> ${booking.guests}</p>
          <p><strong>Booking Amount:</strong> ₹${booking.totalPrice}</p>
        </div>
      `;

      await sendNotification(prisma, {
        userId: ownerUser.id,
        userEmail: ownerUser.email,
        title: `🏨 New Booking Received - ${ref}`,
        message: `New booking received for ${booking.room?.name || 'Standard'} from ${booking.user.name}.`,
        type: 'NEW_BOOKING',
        sendEmail: true,
        emailSubject: `New Booking Confirmed - ${ref}`,
        emailHtml: htmlContent,
        env: c.env,
        ctx: c.executionCtx
      });

      await sendNotification(prisma, {
        userId: ownerUser.id,
        title: `💳 Payment Received`,
        message: `₹${booking.totalPrice} paid for Booking ${ref}. Status: PAID.`,
        type: 'PAYMENT_SUCCESS',
        env: c.env,
        ctx: c.executionCtx
      });
    }

    return c.json({ success: true, booking: updatedBooking });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
};

export const handleWebhook = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  const signature = c.req.header('x-razorpay-signature');
  const rawBody = await c.req.text();
  const secret = c.env.RAZORPAY_WEBHOOK_SECRET || c.env.RAZORPAY_KEY_SECRET;

  if (!signature || !secret) {
    logSecureError('WEBHOOK_FAILED', 'Missing signature or webhook secret', {});
    return c.json({ error: 'Missing signature or secret' }, 400);
  }

  try {
    const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (expectedSignature !== signature) {
      logSecureError('WEBHOOK_VERIFICATION_FAILED', 'Invalid Razorpay Webhook Signature', {});
      return c.json({ error: 'Invalid signature' }, 400);
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    
    // Attempt to extract reference number (receipt) from payment or order entity
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;
    // We typically store the referenceNumber in order.receipt or payment.notes.receipt
    const ref = orderEntity?.receipt || paymentEntity?.notes?.receipt || paymentEntity?.description;

    if (!ref) {
      return c.json({ status: 'ok', msg: 'No reference found in webhook payload' });
    }

    if (event === 'payment.captured' || event === 'payment.authorized' || event === 'order.paid') {
      const booking = await prisma.booking.findUnique({ where: { referenceNumber: ref } });
      
      // Reconcile double payments or missed callbacks
      if (booking && booking.status === 'PENDING') {
         const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
         if (booking.createdAt < fifteenMinsAgo) {
           await prisma.booking.update({
             where: { referenceNumber: ref },
             data: { status: 'CANCELLED', paymentStatus: 'MANUAL_REVIEW_REQUIRED' }
           });
           logSecureError('WEBHOOK_TIMEOUT', 'Webhook received after lock expired. Manual review required.', { ref });
         } else {
           const updatedBooking = await prisma.booking.update({
             where: { referenceNumber: ref },
             data: { 
               status: 'PAID', 
               paymentStatus: 'PAID',
               razorpayPaymentId: paymentEntity?.id || null,
               razorpayOrderId: orderEntity?.id || paymentEntity?.order_id || null
             }
           });
           
           // NOTE: Do NOT re-increment promotion usage here.
           // usageCount is already incremented atomically in createBooking's Serializable transaction.
           // Re-incrementing here would cause double-counting.
           logSecureInfo('WEBHOOK_RECONCILED', 'Booking automatically reconciled via webhook to PAID', { ref });
         }
      }
    } else if (event === 'payment.failed') {
      const booking = await prisma.booking.findUnique({ where: { referenceNumber: ref } });
      if (booking && booking.status === 'PENDING') {
         await prisma.booking.update({
           where: { referenceNumber: ref },
           data: { status: 'CANCELLED' } // Release inventory
         });
         logSecureInfo('WEBHOOK_RECONCILED', 'Booking automatically cancelled via failed webhook', { ref });
      }
    }

    return c.json({ status: 'ok' });
  } catch (err) {
    logSecureError('WEBHOOK_ERROR', err.message, { error: err });
    return c.json({ error: err.message }, 500);
  }
};

export const verifyPaymentCallback = async (c) => {
  const getPrisma = c.get('getPrisma');
  const prisma = getPrisma(c.env);
  const ref = c.req.param('ref');
  const frontendUrl = c.env.FRONTEND_URL || 'https://hampistays.com'; // or use origin if possible
  
  let razorpay_payment_id, razorpay_order_id, razorpay_signature;
  
  try {
    if (c.req.method === 'POST') {
      const body = await c.req.parseBody(); // parse form data
      razorpay_payment_id = body.razorpay_payment_id;
      razorpay_order_id = body.razorpay_order_id;
      razorpay_signature = body.razorpay_signature;
    } else {
      razorpay_payment_id = c.req.query('razorpay_payment_id');
      razorpay_order_id = c.req.query('razorpay_order_id');
      razorpay_signature = c.req.query('razorpay_signature');
    }
  } catch {
    return c.redirect(`${frontendUrl}/checkout?error=invalid_request`);
  }
  
  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return c.redirect(`${frontendUrl}/checkout?error=payment_cancelled`);
  }
  
  try {
    const isValid = await verifyPaymentSignature(
      crypto, 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      c.env.RAZORPAY_KEY_SECRET
    );

    if (!isValid) {
      logSecureError('CALLBACK_VERIFICATION_FAILED', 'Invalid Razorpay Signature', { ref, razorpay_order_id });
      return c.redirect(`${frontendUrl}/checkout?error=verification_failed`);
    }

    const booking = await prisma.booking.findUnique({
      where: { referenceNumber: ref },
    });

    if (!booking) return c.redirect(`${frontendUrl}/checkout?error=booking_not_found`);

    // Only update if PENDING to prevent double-processing
    if (booking.status === 'PENDING') {
      await prisma.booking.update({
        where: { referenceNumber: ref },
        data: { 
          status: 'PAID', 
          paymentStatus: 'PAID',
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id
        }
      });
      // Webhook will handle the rest (commissions, emails, etc) for simplicity, or we can trigger them here.
      // Since webhook is reliable, we can just update status and redirect.
    }

    return c.redirect(`${frontendUrl}/checkout/success?order_id=${ref}`);
  } catch (err) {
    return c.redirect(`${frontendUrl}/checkout?error=server_error`);
  }
};
