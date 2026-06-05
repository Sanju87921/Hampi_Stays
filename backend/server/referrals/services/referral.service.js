import { getPrisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors/index.js';
import { logSecureInfo } from '../../logging/logger.js';

export class ReferralService {
  constructor(env) {
    this.prisma = getPrisma(env);
  }

  async generateReferralCode(userId) {
    // Try to get existing code
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user && user.myReferralCode) {
      return user.myReferralCode;
    }

    // Generate an 8-character alphanumeric code based on User ID
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newCode = `HAMP${randomSuffix}${userId.substring(0, 2).toUpperCase()}`;

    // Save to user
    await this.prisma.user.update({
      where: { id: userId },
      data: { myReferralCode: newCode }
    });

    return newCode;
  }

  async getReferralStats(userId) {
    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      include: { referredUser: { select: { name: true, createdAt: true } } }
    });

    const pendingCount = referrals.filter(r => r.status === 'PENDING').length;
    const completedCount = referrals.filter(r => r.status === 'COMPLETED').length;
    const totalEarned = referrals.reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

    const credits = await this.prisma.rewardCredit.findMany({
      where: { userId }
    });
    const availableCredits = credits.reduce((sum, c) => sum + c.amount, 0);

    return {
      referrals,
      pendingCount,
      completedCount,
      totalEarned,
      availableCredits
    };
  }

  async processReferralCompletion(bookingId) {
    // This is called when a booking completes successfully (Check-out)
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true }
    });

    if (!booking) return;

    // Check if this user was referred and it's their FIRST booking
    const pastBookingsCount = await this.prisma.booking.count({
      where: { userId: booking.userId, status: 'COMPLETED' }
    });

    if (pastBookingsCount > 1) return; // Not their first completed booking

    const referral = await this.prisma.referral.findUnique({
      where: { referredUserId: booking.userId }
    });

    if (referral && referral.status === 'PENDING') {
      await this.prisma.$transaction(async (tx) => {
        // Mark referral as completed
        await tx.referral.update({
          where: { id: referral.id },
          data: { status: 'COMPLETED', completedAt: new Date(), rewardAmount: 500 }
        });

        // Give reward credit to Referrer
        await tx.rewardCredit.create({
          data: {
            userId: referral.referrerId,
            amount: 500, // Fixed referral reward logic (e.g. 500 INR)
            source: 'REFERRAL'
          }
        });
      });

      logSecureInfo('REFERRAL_COMPLETED', `Referral ${referral.referralCode} completed for Referrer ${referral.referrerId}`);
    }
  }
}
