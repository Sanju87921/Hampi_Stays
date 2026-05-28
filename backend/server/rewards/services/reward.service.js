import { getPrisma } from '../../../config/prisma.js';

export class RewardService {
  constructor(env) {
    this.prisma = getPrisma(env);
  }

  async getAvailableBalance(userId) {
    const credits = await this.prisma.rewardCredit.findMany({
      where: {
        userId,
        status: 'AVAILABLE'
      }
    });

    const now = new Date();
    let balance = 0;

    for (const credit of credits) {
      if (!credit.expiresAt || credit.expiresAt > now) {
        balance += credit.amount;
      } else if (credit.expiresAt && credit.expiresAt <= now) {
        // Expired asynchronously
        await this.prisma.rewardCredit.update({
          where: { id: credit.id },
          data: { status: 'EXPIRED' }
        });
      }
    }

    return balance;
  }

  async applyCreditsToBooking(userId, amountNeeded) {
    const credits = await this.prisma.rewardCredit.findMany({
      where: { userId, status: 'AVAILABLE' },
      orderBy: { createdAt: 'asc' } // Use oldest credits first
    });

    let applied = 0;
    const updates = [];

    for (const credit of credits) {
      if (applied >= amountNeeded) break;
      
      const remainingNeeded = amountNeeded - applied;
      if (credit.amount <= remainingNeeded) {
        applied += credit.amount;
        updates.push({ id: credit.id, status: 'USED', usedAt: new Date(), amount: credit.amount });
      } else {
        // Partial usage (Split credit conceptually, but for simplicity we'll assume they consume the full credit or we create a new one for remainder)
        applied += remainingNeeded;
        updates.push({ id: credit.id, status: 'USED', usedAt: new Date() });
        updates.push({ createRemainder: credit.amount - remainingNeeded });
      }
    }

    if (applied < amountNeeded) {
      // Doesn't have enough to cover the requested amount, we apply what they have
    }

    // In a real implementation we would execute `updates` via prisma.$transaction
    return applied;
  }
}
