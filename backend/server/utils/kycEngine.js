export async function evaluateResortOwnerKyc(prisma, ownerId, vSettings, currentIsVerified = false) {
  // Grandfathering: If they are already verified, changing settings shouldn't revoke it
  if (currentIsVerified) return true;

  const allDocs = await prisma.kycDocument.findMany({ where: { ownerId } });
  const bank = await prisma.bankAccount.findUnique({ where: { ownerId } });
  const reqs = vSettings.resortOwnerRequirements || [];

  let isVerified = true;
  for (const req of reqs) {
    if (req === 'EMAIL' || req === 'PHONE') continue;
    if (req === 'BANK_VERIFICATION') {
      if (!bank || bank.status !== 'VERIFIED') isVerified = false;
    } else {
      const doc = allDocs.find(d => d.type === req);
      if (!doc || doc.status !== 'VERIFIED') isVerified = false;
    }
  }
  return isVerified;
}

export async function evaluateGuideKyc(prisma, guideProfileId, vSettings, currentIsVerified = false) {
  // Grandfathering
  if (currentIsVerified) return true;

  const allDocs = await prisma.guideKYC.findMany({ where: { guideProfileId } });
  const reqs = vSettings.guideRequirements || [];

  let isVerified = true;
  for (const req of reqs) {
    if (req === 'EMAIL' || req === 'PHONE') continue;
    const doc = allDocs.find(d => d.type === req);
    if (!doc || doc.status !== 'VERIFIED') isVerified = false;
  }
  return isVerified;
}

export async function evaluateTravellerKyc(prisma, user, vSettings) {
  // Traveller requirements apply dynamically upon action usually, but we can verify status
  const reqs = vSettings.travellerRequirements || [];
  let isVerified = true;
  
  if (reqs.length === 0) return true;

  const allDocs = await prisma.travellerKYC.findMany({ where: { userId: user.id } });

  for (const req of reqs) {
    if (req === 'EMAIL' || req === 'EMAIL_VERIFICATION') {
      if (!user.verifiedEmail) isVerified = false;
    } else if (req === 'PHONE' || req === 'MOBILE_OTP') {
      if (!user.verifiedPhone) isVerified = false;
    } else {
      const doc = allDocs.find(d => d.type === req);
      if (!doc || doc.status !== 'VERIFIED') isVerified = false;
    }
  }
  return isVerified;
}

export async function recalculateAllKyc(prisma, adminId) {
  const vSettings = await prisma.verificationSettings.findFirst() || {
    travellerRequirements: ['MOBILE_OTP', 'EMAIL_VERIFICATION'],
    resortOwnerRequirements: ['AADHAAR', 'PAN'],
    guideRequirements: ['AADHAAR']
  };

  // 1. Recalculate Pending Resort Owners
  const pendingOwners = await prisma.resortOwner.findMany({ where: { isVerified: false } });
  let ownersVerifiedCount = 0;
  for (const owner of pendingOwners) {
    const isNowVerified = await evaluateResortOwnerKyc(prisma, owner.id, vSettings, owner.isVerified);
    if (isNowVerified) {
      await prisma.resortOwner.update({ where: { id: owner.id }, data: { isVerified: true } });
      await prisma.verificationAudit.create({
        data: {
          adminId: adminId || 'SYSTEM',
          targetUserId: owner.userId,
          targetType: 'RESORT',
          action: 'OWNER_VERIFIED',
          newStatus: 'VERIFIED',
          details: 'Verified by requirement recalculation'
        }
      });
      ownersVerifiedCount++;
    }
  }

  // 2. Recalculate Pending Guides
  const pendingGuides = await prisma.guideProfile.findMany({ where: { isVerified: false } });
  let guidesVerifiedCount = 0;
  for (const guide of pendingGuides) {
    const isNowVerified = await evaluateGuideKyc(prisma, guide.id, vSettings, guide.isVerified);
    if (isNowVerified) {
      await prisma.guideProfile.update({ where: { id: guide.id }, data: { isVerified: true } });
      await prisma.verificationAudit.create({
        data: {
          adminId: adminId || 'SYSTEM',
          targetUserId: guide.userId,
          targetType: 'GUIDE',
          action: 'GUIDE_VERIFIED',
          newStatus: 'VERIFIED',
          details: 'Verified by requirement recalculation'
        }
      });
      guidesVerifiedCount++;
    }
  }

  // Generate generic KYC_RECALCULATED audit record
  await prisma.auditLog.create({
    data: {
      adminId: adminId,
      action: 'KYC_RECALCULATED',
      details: { ownersVerifiedCount, guidesVerifiedCount }
    }
  });

  return { ownersVerifiedCount, guidesVerifiedCount };
}

module.exports = {
  evaluateResortOwnerKyc,
  evaluateGuideKyc,
  evaluateTravellerKyc,
  recalculateAllKyc
};
