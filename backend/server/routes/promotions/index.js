import { Hono } from 'hono';
import * as promotionController from '../../promotions/controllers/promotion.controller.js';

export const setupPromotionRoutes = (app, authMiddleware, adminMiddleware) => {
  // Public/Traveler endpoints
  app.get('/api/promotions/active', promotionController.getActivePromotions);
  app.post('/api/promotions/validate', authMiddleware, promotionController.validatePromotion);
  
  // Admin endpoints
  app.get('/api/admin/promotions', authMiddleware, adminMiddleware, promotionController.getPromotions);
  app.post('/api/admin/promotions', authMiddleware, adminMiddleware, promotionController.createPromotion);
  app.patch('/api/admin/promotions/:id', authMiddleware, adminMiddleware, promotionController.updatePromotion);
  app.delete('/api/admin/promotions/:id', authMiddleware, adminMiddleware, promotionController.deletePromotion);
};
