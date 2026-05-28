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
  }).$extends(withAccelerate());
  
  return prismaInstance;
};
