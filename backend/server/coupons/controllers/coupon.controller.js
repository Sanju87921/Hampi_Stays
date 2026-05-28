import { CouponService } from '../services/coupon.service.js';
import { AppError } from '../../utils/errors/index.js';

export const validateCoupon = async (c) => {
  const { code, resortId, totalAmount } = await c.req.json();
  const user = c.get('user');

  if (!code || !resortId || !totalAmount) {
    throw new AppError('Missing required fields for validation', 400);
  }

  const couponService = new CouponService(c.env);
  
  const validationResult = await couponService.validateCoupon(
    code,
    user.id,
    { resortId, totalAmount }
  );

  return c.json({
    success: true,
    data: validationResult
  });
};

export const createCoupon = async (c) => {
  // Admin only endpoint
  const data = await c.req.json();
  const couponService = new CouponService(c.env);
  
  // Omitted complex validation for brevity, assume admin provides valid data
  const coupon = await couponService.prisma.coupon.create({
    data: {
      code: data.code.toUpperCase(),
      type: data.type,
      discountValue: data.discountValue,
      validFrom: new Date(data.validFrom),
      validUntil: new Date(data.validUntil),
      maxUsesTotal: data.maxUsesTotal,
      minBookingAmt: data.minBookingAmt,
      maxDiscountAmt: data.maxDiscountAmt,
      onlyFirstTime: data.onlyFirstTime || false,
      resortId: data.resortId || null
    }
  });

  return c.json({ success: true, coupon });
};

export const getAvailableCoupons = async (c) => {
  const couponService = new CouponService(c.env);
  const now = new Date();
  
  const coupons = await couponService.prisma.coupon.findMany({
    where: {
      isActive: true,
      validFrom: { lte: now },
      validUntil: { gte: now },
      // Return global coupons
      resortId: null
    },
    select: {
      code: true,
      type: true,
      discountValue: true,
      minBookingAmt: true,
      onlyFirstTime: true
    }
  });

  return c.json({ success: true, coupons });
};
