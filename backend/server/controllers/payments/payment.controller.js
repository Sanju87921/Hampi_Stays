import { verifyPaymentSignature } from '../../services/payments/verification.service.js';
import { logSecureError, logSecureInfo } from '../../logging/logger.js';
import { Resend } from 'resend';

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
  
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;
  
  try {
    const isValid = await verifyPaymentSignature(
      crypto, 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      c.env.RAZORPAY_KEY_SECRET
    );

    if (!isValid) {
      logSecureError('PAYMENT_VERIFICATION_FAILED', 'Invalid Razorpay Signature', { ref, razorpay_order_id });
      return c.json({ error: 'Invalid signature' }, 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { referenceNumber: ref },
      include: { user: true, resort: true }
    });

    if (!booking) return c.json({ error: 'Booking not found' }, 404);

    const updatedBooking = await prisma.booking.update({
      where: { referenceNumber: ref },
      data: { status: 'PAID' }
    });

    logSecureInfo('PAYMENT_VERIFIED', 'Payment successfully verified', { ref, razorpay_order_id });
    
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

    return c.json({ success: true, booking: updatedBooking });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
};

export const handleWebhook = async (c) => {
  // Webhook handler stub
  return c.json({ status: 'ok' });
};
