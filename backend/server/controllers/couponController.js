import prisma from '../utils/prisma.js';
import { validateCouponCode } from '../utils/couponEngine.js';
import {
  getAllCoupons,
  createCouponInDb,
  updateCouponStatus,
  deleteCouponFromDb,
  findCouponByCode,
  getBookingCouponsAnalytics
} from '../utils/couponDb.js';

export const validateCoupon = async (req, res, next) => {
  try {
    const { code, resortId, originalAmount } = req.body;
    const userId = req.user?.userId;
    
    const result = await validateCouponCode(prisma, {
      code,
      userId,
      resortId,
      originalAmount: Number(originalAmount)
    });
    
    if (!result.valid) {
      return res.status(400).json({ valid: false, error: result.error });
    }
    
    res.json({
      valid: true,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
      description: result.coupon.description,
      code: result.coupon.code
    });
  } catch (error) {
    next(error);
  }
};

export const applyCoupon = async (req, res, next) => {
  return validateCoupon(req, res, next);
};

// Admin Controller Functions
export const listCoupons = async (req, res, next) => {
  try {
    const coupons = await getAllCoupons(prisma);
    res.json(coupons);
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumAmount,
      maxDiscount,
      usageLimit,
      startsAt,
      expiresAt,
      applicableResortId,
      applicableRole
    } = req.body;

    if (!code || !description || !discountType || discountValue === undefined || !expiresAt) {
      return res.status(400).json({ error: 'Required fields: code, description, discountType, discountValue, expiresAt' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await findCouponByCode(prisma, cleanCode);
    if (existing) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }

    const coupon = await createCouponInDb(prisma, {
      code: cleanCode,
      description,
      discountType,
      discountValue: Number(discountValue),
      minimumAmount: minimumAmount !== undefined ? Number(minimumAmount) : 0,
      maxDiscount: maxDiscount !== undefined ? Number(maxDiscount) : null,
      usageLimit: usageLimit !== undefined ? Number(usageLimit) : null,
      startsAt: startsAt ? new Date(startsAt) : new Date(),
      expiresAt: new Date(expiresAt),
      applicableResortId: applicableResortId || null,
      applicableRole: applicableRole || null
    });

    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
};

export const toggleCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    
    const coupon = await updateCouponStatus(prisma, id, Boolean(active));
    res.json(coupon);
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteCouponFromDb(prisma, id);
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getCouponAnalytics = async (req, res, next) => {
  try {
    const bookingsWithCoupons = await getBookingCouponsAnalytics(prisma);

    let totalDiscountGiven = 0;
    const codeStats = {};

    bookingsWithCoupons.forEach(b => {
      const amt = b.discountAmount || 0;
      totalDiscountGiven += amt;
      
      if (!codeStats[b.couponCode]) {
        codeStats[b.couponCode] = { code: b.couponCode, count: 0, totalDiscount: 0 };
      }
      codeStats[b.couponCode].count += 1;
      codeStats[b.couponCode].totalDiscount += amt;
    });

    const coupons = await getAllCoupons(prisma);
    const activeCampaignsCount = coupons.filter(c => c.active).length;

    res.json({
      activeCampaignsCount,
      totalDiscountGiven,
      couponBookingsCount: bookingsWithCoupons.length,
      couponBreakdown: Object.values(codeStats)
    });
  } catch (error) {
    next(error);
  }
};
