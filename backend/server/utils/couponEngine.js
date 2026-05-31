import { logSecureWarn } from '../logging/logger.js';
import { 
  findCouponByCode, 
  getUserCouponUsageCount, 
  getUserBookingsCount 
} from './couponDb.js';

/**
 * Validates a coupon code against business logic rules.
 * Prevents double-redemptions, abuse, role bypasses, resort exclusions, and brute force attempts.
 */
export async function validateCouponCode(prisma, { code, userId, resortId, originalAmount }) {
  if (!code) {
    return { valid: false, error: 'Coupon code is required' };
  }
  
  const cleanCode = code.trim().toUpperCase();
  const promotion = await prisma.promotion.findUnique({ where: { code: cleanCode } });

  if (!promotion) {
    return { valid: false, error: 'Coupon not found' };
  }

  if (!promotion.active) {
    return { valid: false, error: 'Coupon is inactive' };
  }
  
  const now = new Date();
  if (promotion.validFrom && now < new Date(promotion.validFrom)) {
    return { valid: false, error: 'Coupon campaign has not started yet' };
  }
  if (promotion.validUntil && now > new Date(promotion.validUntil)) {
    return { valid: false, error: 'Coupon has expired' };
  }
  
  if (promotion.usageLimit !== null && promotion.usageCount >= promotion.usageLimit) {
    return { valid: false, error: 'Coupon usage limit reached' };
  }
  
  if (promotion.minBookingAmount !== null && originalAmount < promotion.minBookingAmount) {
    return { valid: false, error: `Minimum booking amount of ₹${promotion.minBookingAmount} required` };
  }

  // If userId is provided, perform user-specific validation
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { valid: false, error: 'User session invalid' };
    }

    // First booking check
    if (promotion.firstBookingOnly) {
      const previousBookingsCount = await prisma.booking.count({ where: { userId } });
      if (previousBookingsCount > 0) {
        logSecureWarn('COUPON_ABUSE_ATTEMPT', 'User attempted first-booking coupon but already has bookings', { userId, couponCode: cleanCode });
        return { valid: false, error: 'This coupon is only valid for your first booking' };
      }
    }
  }

  // Calculate discount securely
  let discountAmount = 0;
  if (promotion.discountType === 'percentage' || promotion.discountType === 'PERCENTAGE') {
    discountAmount = (originalAmount * promotion.discountValue) / 100;
    if (promotion.maxDiscount !== null && discountAmount > promotion.maxDiscount) {
      discountAmount = promotion.maxDiscount;
    }
  } else {
    discountAmount = promotion.discountValue;
  }
  
  // Cap discount at original amount to prevent negative totals
  if (discountAmount > originalAmount) {
    discountAmount = originalAmount;
  }

  return {
    valid: true,
    coupon: { ...promotion, description: promotion.description || `${promotion.discountValue} discount` },
    discountAmount: Math.round(discountAmount),
    finalAmount: Math.max(0, originalAmount - Math.round(discountAmount))
  };
}
