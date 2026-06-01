import { decrypt } from '../utils/crypto.js';

// ── Web Crypto-compatible HMAC helpers (work in Cloudflare Workers) ──────────

async function hmacSign(secret, data) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacVerify(secret, data, token) {
  const expected = await hmacSign(secret, data);
  return expected === token;
}

export const generateSignedKycUrlWorker = async (docId, env) => {
  const expires = Math.floor(Date.now() / 1000) + 300; // 5 minutes validity
  const secret = env.JWT_SECRET || 'hampistays_secure_jwt_secret_2026';
  const token = await hmacSign(secret, `${docId}:${expires}`);
  return `/api/admin/kyc-image/${docId}?expires=${expires}&token=${token}`;
};

export const verifySignedKycUrlWorker = async (docId, expires, token, env) => {
  if (Math.floor(Date.now() / 1000) > parseInt(expires)) return false;
  const secret = env.JWT_SECRET || 'hampistays_secure_jwt_secret_2026';
  return hmacVerify(secret, `${docId}:${expires}`, token);
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
