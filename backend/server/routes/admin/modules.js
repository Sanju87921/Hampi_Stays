import { Hono } from "hono";

export const setupAdminModulesRoutes = (app, authMiddleware, adminMiddleware) => {
  // ─── Refund Management ───────────────────────────────────────────────────
  app.get('/admin/refunds', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const refunds = await prisma.refundRequest.findMany({
        include: {
          booking: {
            include: {
              user: { select: { name: true, email: true } },
              resort: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const mapped = refunds.map(r => ({
        id: r.id,
        bookingRef: r.booking.referenceNumber,
        userName: r.booking.user.name,
        userEmail: r.booking.user.email,
        resortName: r.booking.resort.name,
        amount: r.amount,
        status: r.status,
        reason: r.reason || "No reason provided",
        adminNotes: r.adminNotes,
        requestedAt: r.createdAt.toISOString(),
        processedAt: r.status !== 'PENDING' ? r.updatedAt.toISOString() : undefined,
      }));
      return c.json(mapped);
    } catch (err) {
      console.error("[AdminRefunds] Error:", err);
      return c.json({ error: err.message }, 500);
    }
  });

  app.post('/admin/refunds/:id/process', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const id = c.req.param('id');
    const { action, notes } = await c.req.json();
    try {
      const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
      const refund = await prisma.refundRequest.update({
        where: { id },
        data: { status, adminNotes: notes }
      });
      return c.json({ success: true, refund });
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });

  // ─── Support Help Desk ───────────────────────────────────────────────────
  app.get('/admin/support/tickets', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const tickets = await prisma.supportTicket.findMany({
        include: { messages: true },
        orderBy: { updatedAt: 'desc' }
      });
      return c.json(tickets);
    } catch (err) {
      console.error("[AdminSupport] Error:", err);
      return c.json({ error: err.message }, 500);
    }
  });

  app.post('/admin/support/tickets/:id/reply', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const id = c.req.param('id');
    const { message, status } = await c.req.json();
    try {
      const newMessage = await prisma.supportMessage.create({
        data: {
          ticketId: id,
          sender: 'ADMIN',
          senderName: 'HampiStays Support',
          content: message
        }
      });
      const updatedTicket = await prisma.supportTicket.update({
        where: { id },
        data: { status, updatedAt: new Date() }
      });
      return c.json({ success: true, message: newMessage, ticket: updatedTicket });
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });

  app.patch('/admin/support/tickets/:id/status', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const id = c.req.param('id');
    const { status } = await c.req.json();
    try {
      const ticket = await prisma.supportTicket.update({
        where: { id },
        data: { status, updatedAt: new Date() }
      });
      return c.json({ success: true, ticket });
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });

  // ─── Email Campaigns ─────────────────────────────────────────────────────
  app.get('/admin/campaigns', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      const campaigns = await prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return c.json(campaigns);
    } catch (err) {
      console.error("[AdminCampaigns] Error:", err);
      return c.json({ error: err.message }, 500);
    }
  });

  app.post('/admin/campaigns', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const data = await c.req.json();
    try {
      const status = data.isDraft ? 'DRAFT' : (data.scheduledAt ? 'SCHEDULED' : 'SENT');
      
      // Calculate total recipients mock for now
      let totalRecipients = 0;
      if (data.audience === 'ALL') totalRecipients = await prisma.user.count();
      else if (data.audience === 'TRAVELLERS') totalRecipients = await prisma.user.count({ where: { role: 'TRAVELLER' } });
      else if (data.audience === 'OWNERS') totalRecipients = await prisma.user.count({ where: { role: 'RESORT_OWNER' } });
      else if (data.audience === 'GUIDES') totalRecipients = await prisma.user.count({ where: { role: 'GUIDE' } });

      const campaign = await prisma.campaign.create({
        data: {
          title: data.title,
          subject: data.subject,
          body: data.body,
          audience: data.audience,
          status,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          sentAt: status === 'SENT' ? new Date() : null,
          totalRecipients,
          openRate: status === 'SENT' ? 0 : null,
          clickRate: status === 'SENT' ? 0 : null,
        }
      });
      return c.json({ success: true, campaign });
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });

  app.delete('/admin/campaigns/:id', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const id = c.req.param('id');
    try {
      await prisma.campaign.delete({ where: { id } });
      return c.json({ success: true });
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });

  // ─── Payout History ──────────────────────────────────────────────────────
  app.get('/admin/payouts/history', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    try {
      // Aggregate Payouts logic using ResortOwnerPayout
      const payoutsData = await prisma.resortOwnerPayout.findMany({
        include: {
          owner: { select: { user: { select: { name: true, email: true } } } },
          resort: { select: { name: true } },
          booking: { select: { checkIn: true, checkOut: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      const mapped = payoutsData.map(p => ({
        id: p.id,
        ownerId: p.ownerId,
        ownerName: p.owner?.user?.name || "Unknown",
        ownerEmail: p.owner?.user?.email || "Unknown",
        resortName: p.resort?.name || "Unknown",
        bookingCount: 1, // ResortOwnerPayout is per booking right now
        grossAmount: p.grossAmount,
        platformFee: p.platformCommission,
        taxDeducted: p.grossAmount * 0.05, // Mock TDS
        netAmount: p.netAmount,
        status: p.status, // PENDING, PAID, FAILED, ON_HOLD
        periodStart: p.booking?.checkIn?.toISOString() || p.createdAt.toISOString(),
        periodEnd: p.booking?.checkOut?.toISOString() || p.createdAt.toISOString(),
        paidAt: p.status === 'PAID' ? p.updatedAt.toISOString() : undefined,
      }));

      return c.json(mapped);
    } catch (err) {
      console.error("[AdminPayouts] Error:", err);
      return c.json({ error: err.message }, 500);
    }
  });

  app.post('/admin/payouts/:id/mark-paid', authMiddleware, adminMiddleware, async (c) => {
    const prisma = c.get('getPrisma')(c.env);
    const id = c.req.param('id');
    try {
      const payout = await prisma.resortOwnerPayout.update({
        where: { id },
        data: { status: 'PAID' }
      });
      return c.json({ success: true, payout });
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });
};
