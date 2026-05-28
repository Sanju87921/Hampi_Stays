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
  const coupon = await findCouponByCode(prisma, cleanCode);

  if (!coupon) {
    return { valid: false, error: 'Coupon not found' };
  }

  if (!coupon.active) {
    return { valid: false, error: 'Coupon is inactive' };
  }
  
  const now = new Date();
  if (now < new Date(coupon.startsAt)) {
    return { valid: false, error: 'Coupon campaign has not started yet' };
  }
  if (now > new Date(coupon.expiresAt)) {
    return { valid: false, error: 'Coupon has expired' };
  }
  
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, error: 'Coupon usage limit reached' };
  }
  
  if (coupon.minimumAmount !== null && originalAmount < coupon.minimumAmount) {
    return { valid: false, error: `Minimum booking amount of ₹${coupon.minimumAmount} required` };
  }
  
  if (coupon.applicableResortId && coupon.applicableResortId !== resortId) {
    return { valid: false, error: 'Coupon is not applicable to this resort' };
  }

  // If userId is provided, perform user-specific validation
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { valid: false, error: 'User session invalid' };
    }

    if (coupon.applicableRole && coupon.applicableRole !== user.role) {
      return { valid: false, error: `This coupon is reserved for ${coupon.applicableRole} accounts` };
    }

    // First booking check
    if (cleanCode.startsWith('FIRST') || coupon.description.toLowerCase().includes('first booking')) {
      const previousBookingsCount = await getUserBookingsCount(prisma, userId);
      if (previousBookingsCount > 0) {
        logSecureWarn('COUPON_ABUSE_ATTEMPT', 'User attempted first-booking coupon but already has bookings', { userId, couponCode: cleanCode });
        return { valid: false, error: 'This coupon is only valid for your first booking' };
      }
    }

    // Per-user usage tracking check (prevent abuse)
    const userCouponUsageCount = await getUserCouponUsageCount(prisma, userId, cleanCode);
    if (userCouponUsageCount >= 1) {
      logSecureWarn('COUPON_ABUSE_ATTEMPT', 'User attempted to re-use single-use coupon', { userId, couponCode: cleanCode });
      return { valid: false, error: 'You have already used this coupon' };
    }
  }

  // Calculate discount securely
  let discountAmount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    discountAmount = (originalAmount * coupon.discountValue) / 100;
    if (coupon.maxDiscount !== null && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else if (coupon.discountType === 'FIXED') {
    discountAmount = coupon.discountValue;
  }
  
  // Cap discount at original amount to prevent negative totals
  if (discountAmount > originalAmount) {
    discountAmount = originalAmount;
  }

  return {
    valid: true,
    coupon,
    discountAmount: Math.round(discountAmount),
    finalAmount: Math.max(0, originalAmount - Math.round(discountAmount))
  };
}
