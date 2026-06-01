import ical from 'ical-generator';
import nodeIcal from 'node-ical';

export const setupIcalRoutes = (app, authMiddleware, adminMiddleware) => {
  // 1. Export iCal feed for a specific room (Public route, no auth needed, so Airbnb can fetch it)
  app.get('/api/ical/export/room/:roomId', async (c) => {
    const roomId = c.req.param('roomId');
    const getPrisma = c.get('getPrisma');
    const prisma = getPrisma(c.env);

    try {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { resort: true }
      });

      if (!room) {
        return c.text('Room not found', 404);
      }

      // Fetch bookings and local blocks
      const [bookings, blockings] = await Promise.all([
        prisma.booking.findMany({
          where: { 
            roomId, 
            status: { in: ['CONFIRMED', 'PAID', 'CHECKED_IN'] } 
          }
        }),
        prisma.roomBlocking.findMany({
          where: { roomId }
        })
      ]);

      const calendar = ical({
        name: `HampiStays - ${room.resort.name} - ${room.name}`,
        prodId: { company: 'HampiStays', product: 'iCal Sync', language: 'EN' },
        timezone: 'Asia/Kolkata',
      });

      // Add Bookings
      bookings.forEach(booking => {
        calendar.createEvent({
          start: booking.checkIn,
          end: booking.checkOut,
          summary: `HampiStays Booking (${booking.referenceNumber})`,
          description: `Booked via HampiStays`,
          uid: `booking-${booking.id}@hampistays.com`,
          status: 'CONFIRMED'
        });
      });

      // Add Blockings
      blockings.forEach(block => {
        const startDate = new Date(block.date);
        const endDate = new Date(block.date);
        endDate.setDate(endDate.getDate() + 1); // Full day block

        calendar.createEvent({
          start: startDate,
          end: endDate,
          summary: block.reason || 'Blocked',
          uid: `block-${block.id}@hampistays.com`,
          status: 'CONFIRMED'
        });
      });

      c.header('Content-Type', 'text/calendar; charset=utf-8');
      c.header('Content-Disposition', `attachment; filename="room-${roomId}.ics"`);
      return c.body(calendar.toString());

    } catch (e) {
      console.error('[iCal Export Error]', e);
      return c.json({ error: 'Failed to generate iCal' }, 500);
    }
  });

  // 2. Add/Update external iCal URLs for a room (Owner/Admin only)
  app.post('/api/ical/urls/:roomId', authMiddleware, async (c) => {
    const roomId = c.req.param('roomId');
    const { urls } = await c.req.json();
    const getPrisma = c.get('getPrisma');
    const prisma = getPrisma(c.env);

    try {
      // Validate ownership or admin
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { resort: true }
      });

      if (!room) return c.json({ error: 'Room not found' }, 404);
      
      const user = c.req.user;
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && room.resort.ownerId !== user.userId) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      await prisma.room.update({
        where: { id: roomId },
        data: { externalIcalUrls: urls || [] }
      });

      return c.json({ message: 'URLs updated successfully' });
    } catch (e) {
      console.error('[iCal URL Update Error]', e);
      return c.json({ error: 'Failed to update URLs' }, 500);
    }
  });

  // 3. Trigger manual sync for a room
  app.post('/api/ical/sync/:roomId', authMiddleware, async (c) => {
    const roomId = c.req.param('roomId');
    const getPrisma = c.get('getPrisma');
    const prisma = getPrisma(c.env);

    try {
      const room = await prisma.room.findUnique({
        where: { id: roomId }
      });

      if (!room) return c.json({ error: 'Room not found' }, 404);
      if (!room.externalIcalUrls || room.externalIcalUrls.length === 0) {
        return c.json({ message: 'No external URLs configured' });
      }
      
      let newBlocks = 0;

      for (const url of room.externalIcalUrls) {
        try {
          const events = await nodeIcal.async.fromURL(url);
          
          for (const key in events) {
            const event = events[key];
            if (event.type === 'VEVENT') {
              const start = new Date(event.start);
              const end = new Date(event.end);
              
              // Iterate through days
              let currentDate = new Date(start);
              while (currentDate < end) {
                const dateOnly = new Date(currentDate.toISOString().split('T')[0] + 'T00:00:00Z');
                
                // Upsert blocking
                await prisma.roomBlocking.upsert({
                  where: {
                    roomId_date: {
                      roomId,
                      date: dateOnly
                    }
                  },
                  update: {
                    reason: `External Sync: ${event.summary || 'Blocked'}`
                  },
                  create: {
                    roomId,
                    date: dateOnly,
                    reason: `External Sync: ${event.summary || 'Blocked'}`
                  }
                });
                
                newBlocks++;
                currentDate.setDate(currentDate.getDate() + 1);
              }
            }
          }
        } catch (urlErr) {
          console.error(`Failed to sync URL: ${url}`, urlErr);
        }
      }

      return c.json({ message: 'Sync complete', blocksCreatedOrUpdated: newBlocks });
    } catch (e) {
      console.error('[iCal Sync Error]', e);
      return c.json({ error: 'Sync failed' }, 500);
    }
  });
};
