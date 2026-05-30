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
    if (!['AADHAAR', 'PAN'].includes(type)) return c.json({ error: 'Invalid document type' }, 400);

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

    const owner = await prisma.resortOwner.findUnique({ where: { id: ownerId } });
    await prisma.verificationAudit.create({
      data: {
        adminId, targetUserId: owner.userId, targetType: 'RESORT', action: 'APPROVED', newStatus: 'VERIFIED'
      }
    });
    return c.json({ success: true });
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

    const owner = await prisma.resortOwner.findUnique({ where: { id: ownerId } });
    await prisma.verificationAudit.create({
      data: {
        adminId, targetUserId: owner.userId, targetType: 'RESORT', action: 'REJECTED', newStatus: 'REJECTED', rejectionReason: reason
      }
    });
    return c.json({ success: true });
  });

};
