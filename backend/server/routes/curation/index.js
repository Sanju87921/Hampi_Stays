import { Hono } from 'hono';
import { logSecureError } from '../../logging/logger.js';

/**
 * setupCurationRoutes — registers all curation management endpoints on the Hono app.
 * All routes require ADMIN authentication via adminMiddleware.
 */
export const setupCurationRoutes = (app, authMiddleware, adminMiddleware) => {
  const curation = new Hono();

  // Apply auth + admin guard to all curation routes
  curation.use('*', authMiddleware, adminMiddleware);

  // ─── Seasonal Campaigns ──────────────────────────────────────────────────────

  curation.get('/campaigns', async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const campaigns = await prisma.seasonalCampaign.findMany({
        orderBy: { priority: 'desc' }
      });
      return c.json(campaigns);
    } catch (err) {
      logSecureError('CURATION_ERROR', 'Failed to get campaigns', { error: err });
      return c.json({ error: 'Failed to fetch campaigns' }, 500);
    }
  });

  curation.post('/campaigns', async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const body = await c.req.json();
      const campaign = await prisma.seasonalCampaign.create({ data: body });
      return c.json(campaign, 201);
    } catch (err) {
      logSecureError('CURATION_ERROR', 'Failed to create campaign', { error: err });
      return c.json({ error: 'Failed to create campaign' }, 500);
    }
  });

  curation.put('/campaigns/:id', async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const campaign = await prisma.seasonalCampaign.update({ where: { id }, data: body });
      return c.json(campaign);
    } catch (err) {
      return c.json({ error: 'Failed to update campaign' }, 500);
    }
  });

  curation.delete('/campaigns/:id', async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const id = c.req.param('id');
      await prisma.seasonalCampaign.delete({ where: { id } });
      return c.json({ success: true });
    } catch (err) {
      return c.json({ error: 'Failed to delete campaign' }, 500);
    }
  });

  // ─── Sponsored Placements ────────────────────────────────────────────────────

  curation.get('/sponsored', async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const sponsored = await prisma.sponsoredPlacement.findMany({
        orderBy: { priority: 'desc' }
      });
      return c.json(sponsored);
    } catch (err) {
      return c.json({ error: 'Failed to fetch sponsored placements' }, 500);
    }
  });

  curation.post('/sponsored', async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const body = await c.req.json();
      const sponsored = await prisma.sponsoredPlacement.create({ data: body });
      return c.json(sponsored, 201);
    } catch (err) {
      return c.json({ error: 'Failed to create sponsored placement' }, 500);
    }
  });

  curation.put('/sponsored/:id', async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const sponsored = await prisma.sponsoredPlacement.update({ where: { id }, data: body });
      return c.json(sponsored);
    } catch (err) {
      return c.json({ error: 'Failed to update sponsored placement' }, 500);
    }
  });

  curation.delete('/sponsored/:id', async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const id = c.req.param('id');
      await prisma.sponsoredPlacement.delete({ where: { id } });
      return c.json({ success: true });
    } catch (err) {
      return c.json({ error: 'Failed to delete sponsored placement' }, 500);
    }
  });

  // ─── Curated Experiences ─────────────────────────────────────────────────────

  curation.get('/experiences', async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const experiences = await prisma.curatedExperience.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return c.json(experiences);
    } catch (err) {
      return c.json({ error: 'Failed to fetch experiences' }, 500);
    }
  });

  curation.post('/experiences', async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const body = await c.req.json();
      const experience = await prisma.curatedExperience.create({ data: body });
      return c.json(experience, 201);
    } catch (err) {
      return c.json({ error: 'Failed to create experience' }, 500);
    }
  });

  curation.put('/experiences/:id', async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const experience = await prisma.curatedExperience.update({ where: { id }, data: body });
      return c.json(experience);
    } catch (err) {
      return c.json({ error: 'Failed to update experience' }, 500);
    }
  });

  curation.delete('/experiences/:id', async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const id = c.req.param('id');
      await prisma.curatedExperience.delete({ where: { id } });
      return c.json({ success: true });
    } catch (err) {
      return c.json({ error: 'Failed to delete experience' }, 500);
    }
  });

  // ─── Search Ranking ──────────────────────────────────────────────────────────
  // Returns resorts in ranked order; allows admin to set boost scores

  curation.get('/search-ranking', async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      let resorts;
      try {
        resorts = await prisma.resort.findMany({
          where: { status: 'APPROVED' },
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            rating: true,
            reviewCount: true,
            boostScore: true,
            locationArea: true,
            images: true,
          },
          orderBy: [{ boostScore: 'desc' }, { rating: 'desc' }]
        });
      } catch (_colErr) {
        // boostScore column may not exist yet in production DB — fall back
        resorts = await prisma.resort.findMany({
          where: { status: 'APPROVED' },
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            rating: true,
            reviewCount: true,
            locationArea: true,
            images: true,
          },
          orderBy: { rating: 'desc' }
        });
        resorts = resorts.map(r => ({ ...r, boostScore: 0 }));
      }
      return c.json(resorts);
    } catch (err) {
      return c.json({ error: 'Failed to fetch search ranking' }, 500);
    }
  });

  curation.patch('/search-ranking/:id/boost', async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const id = c.req.param('id');
      const { boostScore } = await c.req.json();
      const resort = await prisma.resort.update({
        where: { id },
        data: { boostScore: Number(boostScore) },
        select: { id: true, name: true, boostScore: true }
      });
      return c.json(resort);
    } catch (err) {
      return c.json({ error: 'Failed to update boost score' }, 500);
    }
  });

  app.route('/curation', curation);
};
