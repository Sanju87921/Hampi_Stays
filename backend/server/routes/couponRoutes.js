import express from 'express';
import * as couponController from '../controllers/couponController.js';
import { authenticate, authorize } from '../middleware/security.js';

const router = express.Router();

// Public & Traveller routes
router.post('/validate', couponController.validateCoupon);
router.post('/apply', couponController.applyCoupon);

// Admin Coupon Management routes
router.get('/admin/list', authenticate, authorize('ADMIN'), couponController.listCoupons);
router.post('/admin/create', authenticate, authorize('ADMIN'), couponController.createCoupon);
router.patch('/admin/:id/toggle', authenticate, authorize('ADMIN'), couponController.toggleCoupon);
router.delete('/admin/:id', authenticate, authorize('ADMIN'), couponController.deleteCoupon);
router.get('/admin/analytics', authenticate, authorize('ADMIN'), couponController.getCouponAnalytics);

export default router;
