import { Resend } from 'resend';

export const setupKycRoutes = (app, authMiddleware, adminMiddleware) => {
  
  // ==========================================
  // PHASE 2A: OWNER KYC APIs
  // ==========================================
  
  app.get('/owner/verification-status', authMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const userId = c.get('userId');
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { resortOwner: true } });
    if (!user || !user.resortOwner) return c.json({ error: 'Owner not found' }, 404);

    const ownerId = user.resortOwner.id;
    const docs = await prisma.kycDocument.findMany({ where: { ownerId } });
    const bank = await prisma.bankAccount.findUnique({ where: { ownerId } });

    const aadhaar = docs.find(d => d.type === 'AADHAAR')?.status || 'NOT_SUBMITTED';
    const pan = docs.find(d => d.type === 'PAN')?.status || 'NOT_SUBMITTED';

    return c.json({
      emailStatus: user.verifiedEmail ? 'VERIFIED' : 'PENDING',
      phoneStatus: user.verifiedPhone ? 'VERIFIED' : 'PENDING',
      aadhaarStatus: aadhaar,
      panStatus: pan,
      bankAccountStatus: bank?.status || 'NOT_SUBMITTED',
      overallStatus: user.resortOwner.isVerified ? 'VERIFIED' : 'PENDING'
    });
  });

  app.get('/owner/documents', authMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const userId = c.get('userId');
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { resortOwner: true } });
    if (!user || !user.resortOwner) return c.json({ error: 'Owner not found' }, 404);

    const docs = await prisma.kycDocument.findMany({ where: { ownerId: user.resortOwner.id } });
    // Masked URLs conceptually
    return c.json({
      documents: docs.map(d => ({
        id: d.id,
        type: d.type,
        status: d.status,
        rejectedReason: d.rejectedReason,
        uploadedAt: d.createdAt
      }))
    });
  });

  app.post('/owner/documents', authMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const userId = c.get('userId');
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { resortOwner: true } });
    if (!user || !user.resortOwner) return c.json({ error: 'Owner not found' }, 404);

    const { type, documentUrl } = await c.req.json();
    
    const vSettings = await prisma.verificationSettings.findFirst();
    const validTypes = vSettings?.resortOwnerRequirements || ['AADHAAR', 'PAN'];
    if (!validTypes.includes(type)) return c.json({ error: 'Invalid document type' }, 400);

    const existing = await prisma.kycDocument.findFirst({ where: { ownerId: user.resortOwner.id, type } });
    let doc;
    if (existing) {
      doc = await prisma.kycDocument.update({
        where: { id: existing.id },
        data: { documentUrl, status: 'PENDING', rejectedReason: null }
      });
    } else {
      doc = await prisma.kycDocument.create({
        data: { ownerId: user.resortOwner.id, type, documentUrl, status: 'PENDING' }
      });
    }

    // Audit Log
    await prisma.verificationAudit.create({
      data: {
        adminId: userId,
        targetUserId: userId,
        targetType: 'RESORT',
        action: 'SUBMITTED',
        newStatus: 'PENDING',
        previousStatus: existing?.status || 'NOT_SUBMITTED'
      }
    });

    return c.json({ success: true, doc });
  });

  // ==========================================
  // PHASE 2B: BANK ACCOUNT MANAGEMENT
  // ==========================================

  app.get('/owner/bank-account', authMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const userId = c.get('userId');
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { resortOwner: true } });
    if (!user || !user.resortOwner) return c.json({ error: 'Owner not found' }, 404);

    const bank = await prisma.bankAccount.findUnique({ where: { ownerId: user.resortOwner.id } });
    if (!bank) return c.json(null);

    return c.json({
      accountHolder: bank.accountHolder,
      bankName: bank.bankName,
      accountNumber: 'XXXXXXXX' + bank.accountNumber.slice(-4),
      ifsc: bank.ifsc,
      status: bank.status
    });
  });

  app.patch('/owner/bank-account', authMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const userId = c.get('userId');
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { resortOwner: true } });
    if (!user || !user.resortOwner) return c.json({ error: 'Owner not found' }, 404);

    const { accountHolder, bankName, accountNumber, ifsc } = await c.req.json();

    const bank = await prisma.bankAccount.upsert({
      where: { ownerId: user.resortOwner.id },
      update: { accountHolder, bankName, accountNumber, ifsc, status: 'PENDING' },
      create: { ownerId: user.resortOwner.id, accountHolder, bankName, accountNumber, ifsc, status: 'PENDING' }
    });

    await prisma.verificationAudit.create({
      data: {
        adminId: userId,
        targetUserId: userId,
        targetType: 'RESORT',
        action: 'SUBMITTED',
        newStatus: 'PENDING',
      }
    });

    return c.json({ success: true });
  });

  // ==========================================
  // PHASE 2C: VERIFICATION HISTORY
  // ==========================================

  app.get('/owner/verification-history', authMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const userId = c.get('userId');
    const logs = await prisma.verificationAudit.findMany({
      where: { targetUserId: userId },
      orderBy: { createdAt: 'desc' }
    });
    return c.json({ history: logs });
  });

  // ==========================================
  // PHASE 2D: ADMIN VERIFICATION WORKFLOW
  // ==========================================

  app.get('/admin/verification-queue', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const pendingDocs = await prisma.kycDocument.findMany({ where: { status: 'PENDING' }, include: { owner: { include: { user: true } } } });
    const pendingBanks = await prisma.bankAccount.findMany({ where: { status: 'PENDING' }, include: { owner: { include: { user: true } } } });
    return c.json({ pendingDocs, pendingBanks });
  });

  app.patch('/admin/verification/:ownerId/approve', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const adminId = c.get('userId');
    const ownerId = c.req.param('ownerId');
    const { type } = await c.req.json(); // AADHAAR, PAN, BANK

    if (type === 'BANK') {
      await prisma.bankAccount.update({ where: { ownerId }, data: { status: 'VERIFIED' } });
    } else {
      const doc = await prisma.kycDocument.findFirst({ where: { ownerId, type } });
      if (doc) await prisma.kycDocument.update({ where: { id: doc.id }, data: { status: 'VERIFIED' } });
    }

    const { evaluateResortOwnerKyc } = await import('../utils/kycEngine.js');
    const owner = await prisma.resortOwner.findUnique({ where: { id: ownerId } });
    const vSettings = await prisma.verificationSettings.findFirst() || { resortOwnerRequirements: ['AADHAAR', 'PAN'] };
    const isNowVerified = await evaluateResortOwnerKyc(prisma, ownerId, vSettings, owner.isVerified);

    if (isNowVerified && !owner.isVerified) {
      await prisma.resortOwner.update({ where: { id: ownerId }, data: { isVerified: true } });
      // Promote resorts that are KYC_PENDING or admin-APPROVED to ACTIVE now that owner is verified
      await prisma.resort.updateMany({ 
        where: { ownerId, status: { in: ['APPROVED', 'KYC_PENDING'] } }, 
        data: { isVerified: true, status: 'ACTIVE' } 
      });

      await prisma.notification.create({
        data: {
          userId: owner.userId,
          title: 'KYC Verification Approved ✨',
          message: 'Your documents have been verified. Your resort is now active and visible to travelers!',
          type: 'account'
        }
      });

      if (c.env.RESEND_API_KEY) {
        const resend = new Resend(c.env.RESEND_API_KEY);
        const ownerUser = await prisma.user.findUnique({ where: { id: owner.userId } });
        if (ownerUser) {
          c.executionCtx.waitUntil(
            resend.emails.send({
              from: c.env.EMAIL_FROM || 'noreply@hampistays.com',
              to: ownerUser.email,
              subject: 'HampiStays - Account Verified!',
              html: `<div style="font-family: sans-serif; padding: 20px;">
                <h1 style="color: #0A0F1E;">Congratulations, ${ownerUser.name}!</h1>
                <p>Your KYC verification is complete. Your resort is now fully active and visible to travelers.</p>
                <p>Welcome to HampiStays.</p>
              </div>`
            }).catch(e => console.error("Email send failed:", e))
          );
        }
      }
    }

    await prisma.verificationAudit.create({
      data: {
        adminId, targetUserId: owner.userId, targetType: 'RESORT', action: 'APPROVED', newStatus: 'VERIFIED',
        details: `Approved ${type}`
      }
    });
    return c.json({ success: true, ownerVerified: isNowVerified });
  });

  app.patch('/admin/verification/:ownerId/reject', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const adminId = c.get('userId');
    const ownerId = c.req.param('ownerId');
    const { type, reason } = await c.req.json();

    if (type === 'BANK') {
      await prisma.bankAccount.update({ where: { ownerId }, data: { status: 'REJECTED' } });
    } else {
      const doc = await prisma.kycDocument.findFirst({ where: { ownerId, type } });
      if (doc) await prisma.kycDocument.update({ where: { id: doc.id }, data: { status: 'REJECTED', rejectedReason: reason } });
    }
    
    // Revoke owner verification if any doc is rejected
    await prisma.resortOwner.update({ where: { id: ownerId }, data: { isVerified: false } });

    const owner = await prisma.resortOwner.findUnique({ where: { id: ownerId } });
    await prisma.verificationAudit.create({
      data: {
        adminId, targetUserId: owner.userId, targetType: 'RESORT', action: 'REJECTED', newStatus: 'REJECTED', rejectionReason: reason,
        details: `Rejected ${type}`
      }
    });

    await prisma.notification.create({
      data: {
        userId: owner.userId,
        title: 'Action Required: KYC Rejected ⚠️',
        message: `Your ${type} document was rejected. Reason: ${reason}. Please upload a new document.`,
        type: 'account'
      }
    });

    if (c.env.RESEND_API_KEY) {
      const resend = new Resend(c.env.RESEND_API_KEY);
      const ownerUser = await prisma.user.findUnique({ where: { id: owner.userId } });
      if (ownerUser) {
        c.executionCtx.waitUntil(
          resend.emails.send({
            from: c.env.EMAIL_FROM || 'noreply@hampistays.com',
            to: ownerUser.email,
            subject: 'HampiStays - KYC Document Rejected',
            html: `<div style="font-family: sans-serif; padding: 20px;">
              <h1 style="color: #0A0F1E;">Action Required, ${ownerUser.name}</h1>
              <p>Your recent KYC submission for <strong>${type}</strong> was unfortunately not accepted.</p>
              <p><strong>Reason provided:</strong> ${reason}</p>
              <p>Please log in to your dashboard to upload a new document.</p>
            </div>`
          }).catch(e => console.error("Email send failed:", e))
        );
      }
    }

    return c.json({ success: true });
  });

};
