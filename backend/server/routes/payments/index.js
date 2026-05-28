import { Hono } from 'hono';
import * as paymentController from '../../controllers/payments/payment.controller.js';

const paymentRoutes = new Hono();

export const setupPaymentRoutes = (app, authMiddleware) => {
  app.post('/bookings/:ref/verify-payment', authMiddleware, paymentController.verifyPayment);
  app.post('/payments/webhook', paymentController.handleWebhook);
};

export default paymentRoutes;
