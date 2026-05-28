import { Hono } from 'hono';
import * as authController from '../../controllers/auth/auth.controller.js';

const authRoutes = new Hono();

authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.login);
// authMiddleware will be applied in worker.js before routing to getMe, or we can apply it here if we extract it.
// To avoid extracting authMiddleware right now (Phase 7), we will pass it from worker.js as c.get('authMiddleware')?
// Hono allows middleware on routes. But since authMiddleware is not extracted, we can just apply it in worker.js for /auth/me or pass it.
// Actually, it's easier to extract authMiddleware to server/middleware/auth.js right now. The user asked for it in Phase 7, but it's required for auth routes. Let's do it minimally.
// Wait, for now we can just export a function that takes authMiddleware and returns the route.
export const setupAuthRoutes = (authMiddleware) => {
  authRoutes.get('/me', authMiddleware, authController.getMe);
  return authRoutes;
};

authRoutes.post('/forgot-password', authController.forgotPassword);
authRoutes.post('/reset-password', authController.resetPassword);
authRoutes.post('/google', authController.googleAuth);
authRoutes.post('/apple', authController.appleAuth);
authRoutes.post('/send-otp', authController.sendOtp);
authRoutes.post('/send-email-otp', authController.sendEmailOtp);
authRoutes.post('/send-mobile-otp', authController.sendMobileOtp);
authRoutes.post('/verify-otp', authController.verifyOtp);
authRoutes.post('/refresh', authController.refreshToken);

export default authRoutes;
