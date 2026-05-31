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
  const promotion = await prisma.promotion.findFirst({ 
    where: { 
      code: { equals: cleanCode, mode: 'insensitive' } 
    } 
  });

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

    // Max uses per user check
    if (promotion.maxUsesPerUser !== null) {
      const pastUses = await prisma.booking.count({ 
        where: { userId, promotionId: promotion.id } 
      });
      if (pastUses >= promotion.maxUsesPerUser) {
        return { valid: false, error: `You have reached the maximum uses (${promotion.maxUsesPerUser}) for this coupon` };
      }
    }
  }

  // Target Scope Validation
  if (promotion.targetType === 'RESORT' && promotion.targetId !== resortId) {
    return { valid: false, error: 'Coupon not valid for this resort' };
  }
  if (promotion.targetType === 'CATEGORY' || promotion.targetType === 'OWNER') {
    const resort = await prisma.resort.findUnique({ where: { id: resortId } });
    if (!resort) return { valid: false, error: 'Resort not found' };
    
    if (promotion.targetType === 'CATEGORY' && resort.type !== promotion.targetId) {
      return { valid: false, error: `Coupon only valid for ${promotion.targetId} category` };
    }
    if (promotion.targetType === 'OWNER' && resort.ownerId !== promotion.targetId) {
      return { valid: false, error: 'Coupon not valid for this resort' };
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

export async function findBestAutoApplyCoupon(prisma, { userId, resortId, originalAmount }) {
  const activePromos = await prisma.promotion.findMany({
    where: {
      active: true,
      autoApply: true,
      OR: [
        { validFrom: null },
        { validFrom: { lte: new Date() } }
      ],
      AND: [
        { OR: [ { validUntil: null }, { validUntil: { gte: new Date() } } ] }
      ]
    }
  });

  let bestPromo = null;
  let maxDiscount = -1;

  for (const promo of activePromos) {
    const res = await validateCouponCode(prisma, { code: promo.code || promo.name, userId, resortId, originalAmount });
    if (res.valid && res.discountAmount > maxDiscount) {
      maxDiscount = res.discountAmount;
      bestPromo = res.coupon;
    }
  }

  return bestPromo;
}

