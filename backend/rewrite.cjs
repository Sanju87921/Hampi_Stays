const fs = require('fs');
const file = 'server/routes/admin/index.js';
let content = fs.readFileSync(file, 'utf8');

const target = `app.on(['POST', 'PATCH'], '/admin/settings', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const { guideServiceEnabled, defaultCommissionRate, requireOtpForSignup } = await c.req.json();
  const userPayload = c.get('user');
  try {
    let adminEmail = userPayload?.email;
    if (!adminEmail && userPayload?.userId) {
      const adminUser = await prisma.user.findUnique({ where: { id: userPayload.userId } });
      if (adminUser) adminEmail = adminUser.email;
    }
    adminEmail = adminEmail || userPayload?.userId || 'system';

    let settings = await prisma.systemSettings.findFirst();
    const data = {};
    if (guideServiceEnabled !== undefined) data.guideServiceEnabled = guideServiceEnabled;
    if (defaultCommissionRate !== undefined) data.defaultCommissionRate = defaultCommissionRate;
    if (requireOtpForSignup !== undefined) data.requireOtpForSignup = requireOtpForSignup;
    data.updatedBy = adminEmail;

    const previousSettings = settings ? { ...settings } : null;

    if (settings) {
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data
      });
    } else {
      settings = await prisma.systemSettings.create({
        data: {
          guideServiceEnabled: guideServiceEnabled !== undefined ? guideServiceEnabled : true,
          defaultCommissionRate: defaultCommissionRate !== undefined ? defaultCommissionRate : 7.0,
          requireOtpForSignup: requireOtpForSignup !== undefined ? requireOtpForSignup : true,
          updatedBy: adminEmail
        }
      });
    }

    // Audit Log in Cloudflare Worker
    console.log(\`[AUDIT] System Settings updated by Admin: \${adminEmail}. \` + 
      \`Changes: \${JSON.stringify(data)}. \` + 
      \`Previous: \${JSON.stringify(previousSettings)}\`);

    return c.json(settings);
  } catch (err) { return c.json({ error: err.message }, 500); }
});`;

const replacement = `app.get('/admin/settings', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  try {
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          guideServiceEnabled: true,
          defaultCommissionRate: 7.0,
          requireOtpForSignup: true,
          maintenanceMode: false,
          detailedAuditLogging: true,
          notifyNewUsers: true,
          notifyHighValueBookings: true,
          notifySystemAlerts: true,
        }
      });
    }
    return c.json(settings);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.on(['POST', 'PATCH'], '/admin/settings', authMiddleware, adminMiddleware, async (c) => {
  const prisma = c.get('getPrisma')(c.env);
  const payload = await c.req.json();
  const userPayload = c.get('user');
  try {
    let adminEmail = userPayload?.email;
    if (!adminEmail && userPayload?.userId) {
      const adminUser = await prisma.user.findUnique({ where: { id: userPayload.userId } });
      if (adminUser) adminEmail = adminUser.email;
    }
    adminEmail = adminEmail || userPayload?.userId || 'system';

    let settings = await prisma.systemSettings.findFirst();
    const data = {};
    
    const allowedKeys = [
      'guideServiceEnabled', 'defaultCommissionRate', 'requireOtpForSignup',
      'maintenanceMode', 'detailedAuditLogging', 'notifyNewUsers',
      'notifyHighValueBookings', 'notifySystemAlerts'
    ];
    
    for (const key of allowedKeys) {
      if (payload[key] !== undefined) {
        data[key] = payload[key];
      }
    }
    
    if (Object.keys(data).length > 0) {
      data.updatedBy = adminEmail;
    }

    const previousSettings = settings ? { ...settings } : null;

    if (settings) {
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data
      });
    } else {
      settings = await prisma.systemSettings.create({
        data: {
          ...data,
          guideServiceEnabled: data.guideServiceEnabled ?? true,
          defaultCommissionRate: data.defaultCommissionRate ?? 7.0,
          requireOtpForSignup: data.requireOtpForSignup ?? true,
          updatedBy: adminEmail
        }
      });
    }

    console.log(\`[AUDIT] System Settings updated by Admin: \${adminEmail}. \` + 
      \`Changes: \${JSON.stringify(data)}. \` + 
      \`Previous: \${JSON.stringify(previousSettings)}\`);

    if (settings && settings.detailedAuditLogging) {
      const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || null;
      const userAgent = c.req.header('user-agent') || null;
      try {
        await prisma.auditLog.create({
          data: {
            adminId: userPayload?.userId || 'system',
            action: 'SETTINGS_UPDATED',
            details: JSON.parse(JSON.stringify(data)),
            ipAddress,
            userAgent
          }
        });
      } catch (err) {
        console.error('Failed to insert audit log:', err);
      }
    }

    return c.json(settings);
  } catch (err) { return c.json({ error: err.message }, 500); }
});`;

// Normalize line endings
content = content.replace(/\r\n/g, '\n');
const normalizedTarget = target.replace(/\r\n/g, '\n');

if (content.includes(normalizedTarget)) {
  content = content.replace(normalizedTarget, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully replaced via JS script.');
} else {
  console.log('Target block still not found.');
}
