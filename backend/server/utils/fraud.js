import prisma from './prisma.js';
import { decrypt } from './crypto.js';

function decryptField(val) {
  if (!val) return null;
  if (val.includes(':')) {
    return decrypt(val);
  }
  return val;
}

/**
 * Run comprehensive fraud detection checks on KYC submissions
 * Checks for duplicate IDs, reused images, and suspicious repeated registrations.
 */
export async function runKycFraudCheck(userId, idNumber, idImage) {
  const flags = [];
  let score = 0;

  if (!idNumber) return { score, flags };

  const targetIdClean = idNumber.replace(/[\s-]/g, '').toLowerCase();

  // Fetch all active users to compare decrypted values in memory
  const allUsers = await prisma.user.findMany({
    where: {
      id: { not: userId },
      deletedAt: null
    },
    select: {
      id: true,
      email: true,
      idNumber: true,
      idImage: true
    }
  });

  for (const otherUser of allUsers) {
    if (otherUser.idNumber) {
      const decIdNum = decryptField(otherUser.idNumber);
      if (decIdNum) {
        const cleanDecIdNum = decIdNum.replace(/[\s-]/g, '').toLowerCase();
        if (cleanDecIdNum === targetIdClean) {
          flags.push('DUPLICATE_ID_NUMBER');
          score = Math.max(score, 90);
        }
      }
    }

    if (idImage && otherUser.idImage) {
      const decImg = decryptField(otherUser.idImage);
      if (decImg === idImage) {
        flags.push('REUSED_DOCUMENT_IMAGE');
        score = Math.max(score, 95);
      }
    }
  }

  // Count rejection history
  const auditCount = await prisma.verificationAudit.count({
    where: {
      targetUserId: userId,
      action: 'REJECTED'
    }
  });

  if (auditCount >= 3) {
    flags.push('REPEATED_REJECTIONS');
    score = Math.max(score, 60);
  }

  return { score, flags };
}
