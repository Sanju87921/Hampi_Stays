import { Hono } from 'hono';
import * as couponController from '../../coupons/controllers/coupon.controller.js';

export const setupCouponRoutes = (app, authMiddleware, adminMiddleware) => {
  app.post('/api/coupons/validate', authMiddleware, couponController.validateCoupon);
  app.get('/api/coupons/available', authMiddleware, couponController.getAvailableCoupons);
  
  // Admin routes
  app.post('/admin/coupons/create', authMiddleware, adminMiddleware, couponController.createCoupon);
};
