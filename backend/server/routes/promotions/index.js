import { Hono } from 'hono';
import * as promotionController from '../../promotions/controllers/promotion.controller.js';

export const setupPromotionRoutes = (app, authMiddleware, adminMiddleware) => {
  // Public/Traveler endpoints
  app.get('/promotions/active', promotionController.getActivePromotions);
  app.post('/promotions/validate', authMiddleware, promotionController.validatePromotion);
  
  // Admin endpoints
  app.get('/admin/promotions', authMiddleware, adminMiddleware, promotionController.getPromotions);
  app.post('/admin/promotions', authMiddleware, adminMiddleware, promotionController.createPromotion);
  app.patch('/admin/promotions/:id', authMiddleware, adminMiddleware, promotionController.updatePromotion);
  app.delete('/admin/promotions/:id', authMiddleware, adminMiddleware, promotionController.deletePromotion);
  
  // Admin Analytics
  app.get('/admin/promotions/analytics', authMiddleware, adminMiddleware, promotionController.getPromotionAnalytics);
};
