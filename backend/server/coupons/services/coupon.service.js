import { getPrisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors/index.js';
import { logSecureInfo, logSecureError } from '../../logging/logger.js';

export class CouponService {
  constructor(env) {
    this.prisma = getPrisma(env);
  }

  async validateCoupon(code, userId, bookingDetails) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: { resort: true }
    });

    if (!coupon) {
      throw new AppError('Invalid or expired coupon code', 400);
    }

    if (!coupon.isActive) {
      throw new AppError('This coupon is no longer active', 400);
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      throw new AppError('This coupon is not valid at this time', 400);
    }

    if (coupon.maxUsesTotal && coupon.currentUses >= coupon.maxUsesTotal) {
      throw new AppError('This coupon has reached its usage limit', 400);
    }

    // Check minimum booking amount
    if (coupon.minBookingAmt && bookingDetails.totalAmount < coupon.minBookingAmt) {
      throw new AppError(`This coupon requires a minimum booking amount of ₹${coupon.minBookingAmt}`, 400);
    }

    // Resort specific check
    if (coupon.resortId && coupon.resortId !== bookingDetails.resortId) {
      throw new AppError(`This coupon is only valid for ${coupon.resort.name}`, 400);
    }

    // First time user check
    if (coupon.onlyFirstTime) {
      const pastBookings = await this.prisma.booking.count({ where: { userId } });
      if (pastBookings > 0) {
        throw new AppError('This coupon is only valid for your first booking', 400);
      }
    }

    // Per-user limit check
    const userRedemptions = await this.prisma.couponRedemption.count({
      where: { couponId: coupon.id, userId }
    });
    if (userRedemptions >= coupon.maxUsesPerUser) {
      throw new AppError('You have reached the maximum usage limit for this coupon', 400);
    }

    // Calculate discount
    let discountAmt = 0;
    if (coupon.type === 'PERCENTAGE') {
      discountAmt = bookingDetails.totalAmount * (coupon.discountValue / 100);
      if (coupon.maxDiscountAmt && discountAmt > coupon.maxDiscountAmt) {
        discountAmt = coupon.maxDiscountAmt;
      }
    } else if (coupon.type === 'FLAT' || coupon.type === 'FIRST_BOOKING') {
      discountAmt = coupon.discountValue;
    }

    // Safety bounds
    if (discountAmt > bookingDetails.totalAmount) {
      discountAmt = bookingDetails.totalAmount * 0.99; // Never allow 100% free unless specific type?
    }

    return {
      couponId: coupon.id,
      code: coupon.code,
      discountAmt: Math.round(discountAmt),
      finalAmount: Math.round(bookingDetails.totalAmount - discountAmt)
    };
  }

  async redeemCoupon(couponId, userId, bookingId, discountAmt) {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Increment usage
        const updatedCoupon = await tx.coupon.update({
          where: { id: couponId },
          data: { currentUses: { increment: 1 } }
        });

        if (updatedCoupon.maxUsesTotal && updatedCoupon.currentUses > updatedCoupon.maxUsesTotal) {
          throw new AppError('Coupon reached max usage limit concurrently', 400);
        }

        // Record redemption
        await tx.couponRedemption.create({
          data: {
            couponId,
            userId,
            bookingId,
            discountAmt
          }
        });
      });
      
      logSecureInfo('COUPON_REDEEMED', `User redeemed coupon ${couponId}`, { userId, bookingId });
      return true;
    } catch (err) {
      logSecureError('COUPON_REDEMPTION_FAILED', 'Failed to redeem coupon', { userId, couponId, error: err.message });
      throw new AppError(err.message || 'Failed to apply discount', 500);
    }
  }
}
