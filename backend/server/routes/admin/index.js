import { Hono } from "hono";
import * as adminController from "../../controllers/admin/admin.controller.js";

const adminRoutes = new Hono();

export const setupAdminRoutes = (app, authMiddleware, adminMiddleware) => {
  app.get('/admin/stats', authMiddleware, adminMiddleware, adminController.getAdminStats);
  app.get('/admin/users', authMiddleware, adminMiddleware, adminController.getAdminUsers);
  app.delete('/admin/users/:id', authMiddleware, adminMiddleware, adminController.deleteAdminUser);
  app.get('/admin/resorts/pending', authMiddleware, adminMiddleware, adminController.getPendingResorts);
  app.get('/admin/resorts/active', authMiddleware, adminMiddleware, adminController.getActiveResorts);
  app.patch('/admin/resorts/:id/status', authMiddleware, adminMiddleware, adminController.updateResortStatus);
  app.patch('/admin/resorts/:id/commission', authMiddleware, adminMiddleware, adminController.updateResortCommission);
  app.patch('/admin/resorts/:id/feature', authMiddleware, adminMiddleware, adminController.updateResortFeature);
  app.get('/admin/guides', authMiddleware, adminMiddleware, adminController.getAdminGuides);
  app.patch('/admin/guides/:id/status', authMiddleware, adminMiddleware, adminController.updateGuideStatus);
  app.get('/admin/kyc-image/:id', authMiddleware, adminMiddleware, adminController.getKycImage);
  app.get('/admin/audit-logs', authMiddleware, adminMiddleware, adminController.getAuditLogs);
  app.patch('/admin/guides/:id/toggle-active', authMiddleware, adminMiddleware, adminController.toggleGuideActive);
  app.get('/admin/payouts', authMiddleware, adminMiddleware, adminController.getPayouts);
  app.get('/admin/reviews/flagged', authMiddleware, adminMiddleware, adminController.getFlaggedReviews);
  app.get('/admin/coupons', authMiddleware, adminMiddleware, adminController.getCoupons);
  app.post('/admin/coupons', authMiddleware, adminMiddleware, adminController.createCoupon);
  app.patch('/admin/coupons/:id/toggle', authMiddleware, adminMiddleware, adminController.toggleCoupon);
  app.delete('/admin/coupons/:id', authMiddleware, adminMiddleware, adminController.deleteCoupon);
  app.get('/admin/coupons/analytics', authMiddleware, adminMiddleware, adminController.getCouponAnalytics);
  app.get('/hero-slides', adminController.getHeroSlides);
  app.post('/hero-slides', authMiddleware, adminMiddleware, adminController.createHeroSlide);
  app.put('/hero-slides/:id', authMiddleware, adminMiddleware, adminController.updateHeroSlide);
  app.delete('/hero-slides/:id', authMiddleware, adminMiddleware, adminController.deleteHeroSlide);
  app.post('/hero-slides/reorder', authMiddleware, adminMiddleware, adminController.reorderHeroSlides);
  app.on(['POST', 'PATCH'], '/admin/settings', authMiddleware, adminMiddleware, adminController.updateSettings);
};
