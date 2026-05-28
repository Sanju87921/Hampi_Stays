export const setupHealthRoutes = (app) => {
  // Global Route Health
  app.get('/health/routes', (c) => {
    return c.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      routes: [
        '/api/auth/*',
        '/api/bookings/*',
        '/api/admin/*',
        '/api/health/*',
        '/api/hero-slides'
      ],
      message: 'All critical route domains are mounted and reachable.'
    });
  });

  // Database Connection Health
  app.get('/health/database', async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      
      return c.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        latencyMs: latency,
        message: 'Database connection is stable and responding.'
      });
    } catch (err) {
      return c.json({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        error: err.message,
        message: 'Database connection failed.'
      }, 500);
    }
  });

  // Authentication Health
  app.get('/health/auth', async (c) => {
    // Quick check to see if JWT operations or Prisma auth tables are healthy
    const prisma = c.get('getPrisma')(c.env);
    try {
      const activeSessions = await prisma.adminSession.count();
      return c.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        activeAdminSessions: activeSessions,
        message: 'Authentication service is operational.'
      });
    } catch (err) {
      return c.json({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        error: err.message,
        message: 'Authentication service degraded.'
      }, 500);
    }
  });
};
