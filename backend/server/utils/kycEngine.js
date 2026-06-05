export async function evaluateResortOwnerKyc(prisma, ownerId, vSettings, currentIsVerified = false) {

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
  if (user.kycStatus === 'VERIFIED') return true;
  
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

  // 1. Recalculate Resort Owners
  const allOwners = await prisma.resortOwner.findMany();
  let ownersVerifiedCount = 0;
  let ownersRevokedCount = 0;
  for (const owner of allOwners) {
    const isNowVerified = await evaluateResortOwnerKyc(prisma, owner.id, vSettings, owner.isVerified);
    
    if (isNowVerified && !owner.isVerified) {
      // Upgraded to Verified
      await prisma.resortOwner.update({ where: { id: owner.id }, data: { isVerified: true } });
      await prisma.resort.updateMany({ 
        where: { ownerId: owner.id, status: 'APPROVED' }, 
        data: { isVerified: true, status: 'ACTIVE' } 
      });
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
    } else if (!isNowVerified && owner.isVerified) {
      // Revoked
      await prisma.resortOwner.update({ where: { id: owner.id }, data: { isVerified: false } });
      await prisma.resort.updateMany({ 
        where: { ownerId: owner.id, status: 'ACTIVE' }, 
        data: { isVerified: false, status: 'KYC_PENDING' } 
      });
      await prisma.verificationAudit.create({
        data: {
          adminId: adminId || 'SYSTEM',
          targetUserId: owner.userId,
          targetType: 'RESORT',
          action: 'OWNER_REVOKED',
          newStatus: 'REJECTED',
          details: 'Verification revoked by new requirement recalculation'
        }
      });
      ownersRevokedCount++;
    }
  }

  // 2. Recalculate Guides
  const allGuides = await prisma.guideProfile.findMany();
  let guidesVerifiedCount = 0;
  let guidesRevokedCount = 0;
  for (const guide of allGuides) {
    const isNowVerified = await evaluateGuideKyc(prisma, guide.id, vSettings, guide.isVerified);
    
    if (isNowVerified && !guide.isVerified) {
      // Upgraded
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
    } else if (!isNowVerified && guide.isVerified) {
      // Revoked
      await prisma.guideProfile.update({ where: { id: guide.id }, data: { isVerified: false } });
      await prisma.verificationAudit.create({
        data: {
          adminId: adminId || 'SYSTEM',
          targetUserId: guide.userId,
          targetType: 'GUIDE',
          action: 'GUIDE_REVOKED',
          newStatus: 'REJECTED',
          details: 'Verification revoked by new requirement recalculation'
        }
      });
      guidesRevokedCount++;
    }
  }

  // Generate generic KYC_RECALCULATED audit record
  await prisma.auditLog.create({
    data: {
      adminId: adminId,
      action: 'KYC_RECALCULATED',
      details: { ownersVerifiedCount, ownersRevokedCount, guidesVerifiedCount, guidesRevokedCount }
    }
  });

  return { ownersVerifiedCount, ownersRevokedCount, guidesVerifiedCount, guidesRevokedCount };
}

