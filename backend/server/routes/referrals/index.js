import * as referralController from '../../referrals/controllers/referral.controller.js';

export const setupReferralRoutes = (app, authMiddleware) => {
  app.get('/api/referrals/dashboard', authMiddleware, referralController.getReferralDashboard);
};
