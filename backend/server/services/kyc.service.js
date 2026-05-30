import crypto from 'crypto';
import { decrypt } from '../utils/crypto.js';

export const generateSignedKycUrlWorker = (guideId, env) => {
  const expires = Math.floor(Date.now() / 1000) + 300; // 5 minutes validity
  const secret = env.JWT_SECRET || 'aa30357b7387e0d6e0c78f02298713a3cced0b36db2031f3823e0a27336425875eae06cba281f25256cdfdc09e171dee2ab48443652046c3e8d81174da19417f';
  const dataToSign = `${guideId}:${expires}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(dataToSign);
  const token = hmac.digest('hex');
  return `/api/admin/kyc-image/${guideId}?expires=${expires}&token=${token}`;
};

export const verifySignedKycUrlWorker = (guideId, expires, token, env) => {
  if (Math.floor(Date.now() / 1000) > parseInt(expires)) {
    return false;
  }
  const secret = env.JWT_SECRET || 'aa30357b7387e0d6e0c78f02298713a3cced0b36db2031f3823e0a27336425875eae06cba281f25256cdfdc09e171dee2ab48443652046c3e8d81174da19417f';
  const dataToSign = `${guideId}:${expires}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(dataToSign);
  const expectedToken = hmac.digest('hex');
  return token === expectedToken;
};

export const runKycFraudCheckWorker = async (userId, idNumber, idImage, prisma) => {
  const flags = [];
  let score = 0;

  if (!idNumber) return { score, flags };

  const targetIdClean = idNumber.replace(/[\s-]/g, '').toLowerCase();

  // Fetch all active users
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
      const decIdNum = decrypt(otherUser.idNumber);
      if (decIdNum) {
        const cleanDecIdNum = decIdNum.replace(/[\s-]/g, '').toLowerCase();
        if (cleanDecIdNum === targetIdClean) {
          flags.push('DUPLICATE_ID_NUMBER');
          score = Math.max(score, 90);
        }
      }
    }

    if (idImage && otherUser.idImage) {
      const decImg = decrypt(otherUser.idImage);
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
};
