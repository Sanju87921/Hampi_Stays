import { Hono } from "hono";

/**
 * setupAdminRoutes — registers modularized admin management routes.
 * Hero slides handlers are inlined here because admin.controller.js
 * has encoding issues from the original generation phase.
 * Other admin endpoints remain inline in worker.js (getAdminStats, etc.)
 */
export const setupAdminRoutes = (app, authMiddleware, adminMiddleware) => {

  // ─── Hero Slides ─────────────────────────────────────────────────────────────
  // Public GET (no auth) so the landing page carousel can load without a token
  app.get('/hero-slides', async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const includeAll = c.req.query('all') === 'true';
    try {
      const slides = await prisma.homepageHero.findMany({
        where: includeAll ? {} : { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      return c.json(slides);
    } catch (err) {
      // Table may not exist yet — return empty array so frontend degrades gracefully
      if (
        err.code === 'P2021' ||
        err.message?.includes('does not exist') ||
        err.message?.includes('homepage_heroes')
      ) {
        console.warn('[HeroSlides] Table not found — returning empty array');
        return c.json([]);
      }
      console.error('[HeroSlides] GET error:', err.message);
      return c.json({ error: 'Failed to fetch hero slides' }, 500);
    }
  });

  app.post('/hero-slides', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const data = await c.req.json();
      const slide = await prisma.homepageHero.create({ data });
      return c.json(slide, 201);
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });

  app.put('/hero-slides/:id', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const id = c.req.param('id');
      const data = await c.req.json();
      const slide = await prisma.homepageHero.update({ where: { id }, data });
      return c.json(slide);
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });

  app.delete('/hero-slides/:id', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const id = c.req.param('id');
      await prisma.homepageHero.delete({ where: { id } });
      return c.json({ success: true });
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });

  app.post('/hero-slides/reorder', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const { ids } = await c.req.json();
      if (!Array.isArray(ids)) return c.json({ error: 'ids must be an array' }, 400);
      await Promise.all(
        ids.map((id, index) =>
          prisma.homepageHero.update({ where: { id }, data: { sortOrder: index } })
        )
      );
      return c.json({ success: true });
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });
};
