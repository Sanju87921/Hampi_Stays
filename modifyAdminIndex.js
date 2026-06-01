const fs = require('fs');
let code = fs.readFileSync('backend/server/routes/admin/index.js', 'utf8');

const updatedGetResorts = \pp.get('/admin/kyc/resorts', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const docs = await prisma.kycDocument.findMany({
        include: {
          owner: {
            include: { user: { select: { name: true, email: true } } }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      const { generateSignedKycUrlWorker } = require('../../utils/crypto');
      const secureDocs = docs.map(doc => ({
        ...doc,
        documentUrl: generateSignedKycUrlWorker(doc.id, c.env).replace('/api/admin/kyc-image/', '/api/admin/kyc-document/')
      }));
      return c.json(secureDocs);
    } catch (err) { return c.json({ error: err.message }, 500); }
  });\;

code = code.replace(/app\.get\('\/admin\/kyc\/resorts', authMiddleware, adminMiddleware, async \(c\) => \{[\s\S]*?catch \(err\) \{ return c\.json\(\{ error: err\.message \}, 500\); \}\n  \}\);/, updatedGetResorts);

const updatedPatchResorts = \pp.patch('/admin/kyc/resorts/:id', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const id = c.req.param('id');
  const { status, rejectionReason } = await c.req.json();
  const adminId = c.get('userId');
  try {
    const doc = await prisma.kycDocument.update({
      where: { id },
      data: { status, rejectedReason: rejectionReason },
      include: { owner: true }
    });
    
    const ownerId = doc.ownerId;
    const allDocs = await prisma.kycDocument.findMany({ where: { ownerId } });
    const bank = await prisma.bankAccount.findUnique({ where: { ownerId } });
    
    const aadhaarVerified = allDocs.find(d => d.type === 'AADHAAR')?.status === 'VERIFIED';
    const panVerified = allDocs.find(d => d.type === 'PAN')?.status === 'VERIFIED';
    const bankVerified = bank?.status === 'VERIFIED';

    const isVerified = aadhaarVerified && panVerified && bankVerified;
    
    if (status === 'REJECTED') {
      await prisma.resortOwner.update({ where: { id: ownerId }, data: { isVerified: false } });
    } else if (isVerified) {
      await prisma.resortOwner.update({ where: { id: ownerId }, data: { isVerified: true } });
    }

    if (doc.owner) {
      await prisma.verificationAudit.create({
        data: {
          adminId: adminId || 'SYSTEM',
          targetUserId: doc.owner.userId,
          targetType: 'RESORT',
          action: status,
          newStatus: status,
          rejectionReason: rejectionReason,
          details: \\ \\
        }
      });
    }

    return c.json(doc);
  } catch (err) { return c.json({ error: err.message }, 500); }
});\;

code = code.replace(/app\.patch\('\/admin\/kyc\/resorts\/:id', authMiddleware, adminMiddleware, async \(c\) => \{[\s\S]*?catch \(err\) \{ return c\.json\(\{ error: err\.message \}, 500\); \}\n\}\);/, updatedPatchResorts);

fs.writeFileSync('backend/server/routes/admin/index.js', code);
console.log('Successfully updated index.js');

