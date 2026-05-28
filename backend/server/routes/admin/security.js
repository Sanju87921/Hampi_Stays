import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export const setupAdminSecurityRoutes = (app, authMiddleware, adminMiddleware) => {
  
  // Create an audit log entry
  const logAudit = async (prisma, adminId, action, details, req) => {
    try {
      const ipAddress = req.header('cf-connecting-ip') || req.header('x-forwarded-for') || null;
      const userAgent = req.header('user-agent') || null;
      await prisma.auditLog.create({
        data: {
          adminId,
          action,
          details: details ? JSON.parse(JSON.stringify(details)) : null,
          ipAddress,
          userAgent
        }
      });
    } catch (e) {
      console.error("[AuditLog Error]", e);
    }
  };

  // --- Profile Settings ---
  app.post('/admin/profile/update', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const adminId = c.get('user').userId;
    try {
      const { name, theme, language } = await c.req.json();
      const user = await prisma.user.update({
        where: { id: adminId },
        data: {
          ...(name && { name }),
          ...(theme && { theme }),
          ...(language && { language }),
        }
      });
      await logAudit(prisma, adminId, 'PROFILE_UPDATED', { theme, language }, c.req);
      return c.json({ success: true, user: { name: user.name, theme: user.theme, language: user.language } });
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });

  // --- Password Reset ---
  app.post('/admin/security/reset-password', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const adminId = c.get('user').userId;
    try {
      const { currentPassword, newPassword } = await c.req.json();
      
      const admin = await prisma.user.findUnique({ where: { id: adminId } });
      if (!admin) return c.json({ error: 'User not found' }, 404);

      const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);
      if (!isValid) return c.json({ error: 'Invalid current password' }, 400);

      const newHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: adminId },
        data: { passwordHash: newHash }
      });

      // Invalidate all other sessions (if using token tables)
      await prisma.adminSession.deleteMany({
        where: { userId: adminId, token: { not: c.req.header('Authorization')?.split(' ')[1] || '' } }
      });

      await logAudit(prisma, adminId, 'PASSWORD_RESET', {}, c.req);

      return c.json({ success: true, message: 'Password reset successfully. Other sessions revoked.' });
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });

  // --- MFA Setup & Verify ---
  app.post('/admin/security/mfa/setup', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const adminId = c.get('user').userId;
    try {
      const admin = await prisma.user.findUnique({ where: { id: adminId } });
      
      const secret = authenticator.generateSecret();
      const otpauthUrl = authenticator.keyuri(admin.email, 'HampiStays Admin', secret);
      const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

      // Temporarily store the secret in the DB until verified
      await prisma.user.update({
        where: { id: adminId },
        data: { mfaSecret: secret, isMfaEnabled: false }
      });

      return c.json({ secret, qrCodeUrl });
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });

  app.post('/admin/security/mfa/verify', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const adminId = c.get('user').userId;
    try {
      const { token } = await c.req.json();
      const admin = await prisma.user.findUnique({ where: { id: adminId } });

      if (!admin.mfaSecret) {
        return c.json({ error: 'MFA not initialized' }, 400);
      }

      const isValid = authenticator.verify({ token, secret: admin.mfaSecret });
      if (!isValid) {
        return c.json({ error: 'Invalid authentication code' }, 400);
      }

      await prisma.user.update({
        where: { id: adminId },
        data: { isMfaEnabled: true }
      });

      await logAudit(prisma, adminId, 'MFA_ENABLED', {}, c.req);

      return c.json({ success: true, message: 'MFA successfully enabled' });
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });

  // --- Sessions Management ---
  app.get('/admin/security/sessions', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const adminId = c.get('user').userId;
    try {
      const sessions = await prisma.adminSession.findMany({
        where: { userId: adminId },
        orderBy: { lastSeen: 'desc' }
      });
      
      let safeSessions = sessions || [];
      if (safeSessions.length === 0) {
        safeSessions = [{
          id: 'current',
          ipAddress: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1',
          userAgent: c.req.header('user-agent') || 'Unknown Device',
          isActive: true,
          lastSeen: new Date().toISOString()
        }];
      }
      
      return c.json({ success: true, sessions: safeSessions });
    } catch (err) {
      console.error("[Session Fetch Error]", err);
      return c.json({ success: false, error: 'Failed to fetch sessions' }, 500);
    }
  });

  app.delete('/admin/security/sessions/:id', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const adminId = c.get('user').userId;
    const sessionId = c.req.param('id');
    try {
      if (sessionId !== 'current') {
        await prisma.adminSession.delete({
          where: { id: sessionId, userId: adminId }
        });
      }
      await logAudit(prisma, adminId, 'SESSION_REVOKED', { sessionId }, c.req);
      return c.json({ success: true });
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });
};
