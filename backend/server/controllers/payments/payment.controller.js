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


    
    // Async Notifications
    if (c.env.RESEND_API_KEY && booking.user.email) {
      const resend = new Resend(c.env.RESEND_API_KEY);
      c.executionCtx.waitUntil(
        resend.emails.send({
          from: c.env.EMAIL_FROM || 'noreply@hampistays.com',
          to: booking.user.email,
          subject: `Booking Confirmed - ${booking.resort.name}`,
          html: `<h1>Your booking is confirmed!</h1><p>Reference: ${ref}</p>`
        }).catch(console.error)
      );
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
