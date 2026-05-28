import { getPrisma } from '../config/prisma.js';
import { logSecureInfo } from '../logging/logger.js';

export class BookingRecoveryService {
  constructor(env) {
    this.prisma = getPrisma(env);
  }

  async processAbandonedBookings() {
    // Detect bookings that have been pending for more than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const abandonedBookings = await this.prisma.booking.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lte: oneHourAgo,
          gte: twoHoursAgo // Avoid endlessly emailing ancient abandoned carts
        }
      },
      include: {
        user: true,
        resort: true
      }
    });

    for (const booking of abandonedBookings) {
      // In a real implementation we would:
      // 1. Generate an automatic recovery coupon (e.g. 5% off)
      // 2. Send email via Resend or WhatsApp via Twilio
      logSecureInfo('ABANDONED_CART_RECOVERY', `Triggered recovery flow for booking ${booking.id}`, { userId: booking.user.id });

      // Create a temporary recovery coupon
      const code = `COMEBACK${booking.id.substring(0, 4).toUpperCase()}`;
      await this.prisma.coupon.create({
        data: {
          code,
          type: 'PERCENTAGE',
          discountValue: 5,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24h
          maxUsesTotal: 1,
          resortId: booking.resortId,
          onlyFirstTime: false
        }
      });
    }

    return abandonedBookings.length;
  }
}
