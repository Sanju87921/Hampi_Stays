import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

let prismaInstance = null;

export const getPrisma = (env) => {
  if (prismaInstance) return prismaInstance;
  
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in the environment.');
  }

  prismaInstance = new PrismaClient({
    datasourceUrl: env.DATABASE_URL,
    log: ['query', 'info', 'warn', 'error']
  }).$extends(withAccelerate())
  .$extends({
    query: {
      auditLog: {
        async create({ args, query }) {
          const criticalActions = [
            'ADMIN_LOGIN', 
            'ADMIN_FAILED_LOGIN', 
            'QR_SCANNED',
            'SETTINGS_UPDATED',
            'MAINTENANCE_MODE_TOGGLED'
          ];
          const action = args.data.action;
          if (!criticalActions.includes(action)) {
            try {
              // We must use a raw fetch or standard findFirst.
              const settings = await prismaInstance.systemSettings.findFirst();
              if (settings && !settings.detailedAuditLogging) {
                return { id: 'suppressed', suppressed: true }; // Suppress log
              }
            } catch (e) {
              console.error('Audit settings check failed:', e);
            }
          }
          return query(args);
        }
      }
    }
  });
  
  return prismaInstance;
};
