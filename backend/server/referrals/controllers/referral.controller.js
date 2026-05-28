import { ReferralService } from '../services/referral.service.js';

export const getReferralDashboard = async (c) => {
  const user = c.get('user');
  const service = new ReferralService(c.env);
  
  const code = service.generateReferralCode(user.id);
  const stats = await service.getReferralStats(user.id);

  return c.json({
    success: true,
    data: {
      referralCode: code,
      ...stats
    }
  });
};
