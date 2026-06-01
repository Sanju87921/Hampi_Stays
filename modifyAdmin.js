const fs = require('fs');
let code = fs.readFileSync('backend/server/controllers/admin/admin.controller.js', 'utf8');

const updatedStatusLogic = \export const updateResortStatus = async (c) => {
    const getPrisma = c.get('getPrisma');
    const prisma = getPrisma(c.env);
    const id = c.req.param('id');
    const { status } = await c.req.json();
    try {
      if (status === 'ACTIVE' || status === 'APPROVED') {
        const resort = await prisma.resort.findUnique({
          where: { id },
          include: { owner: true }
        });
        if (!resort) return c.json({ error: 'Resort not found' }, 404);
        if (resort.owner && !resort.owner.isVerified) {
          await prisma.auditLog.create({
            data: {
              action: 'RESORT_APPROVAL_BLOCKED',
              details: 'KYC not verified for owner ' + resort.owner.id,
              userId: c.get('userId'),
              targetId: resort.id
            }
          });
          return c.json({ error: 'KYC_VERIFICATION_REQUIRED', message: 'Resort cannot be approved until KYC verification is completed.' }, 403);
        }
      }
      const resort = await prisma.resort.update({ where: { id }, data: { status } });
      return c.json(resort);
    } catch (err) { return c.json({ error: err.message }, 500); }
  };\;

code = code.replace(/export const updateResortStatus = async \(c\) => \{[\s\S]*?catch \(err\) \{ return c\.json\(\{ error: err\.message \}, 500\); \}\n  \};/, updatedStatusLogic);

fs.writeFileSync('backend/server/controllers/admin/admin.controller.js', code);
console.log('Modified admin.controller.js');

