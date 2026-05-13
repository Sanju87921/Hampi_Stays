import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getStats = async (req, res, next) => {
  try {
    const [userCount, resortCount, bookingCount, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.resort.count(),
      prisma.booking.count(),
      prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: { status: 'CONFIRMED' }
      })
    ]);

    res.json({
      userCount,
      resortCount,
      bookingCount,
      revenue: totalRevenue._sum.totalPrice || 0,
      platformRating: 4.8,
      avgBookingValue: bookingCount > 0 ? (totalRevenue._sum.totalPrice || 0) / bookingCount : 0,
      cancellationRate: 4.2 // Mock for now
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        phone: true,
        kycStatus: true
      }
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.$transaction([
      prisma.booking.deleteMany({ where: { userId: id } }),
      prisma.wishlist.deleteMany({ where: { userId: id } }),
      prisma.review.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } })
    ]);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getPendingResorts = async (req, res, next) => {
  try {
    const resorts = await prisma.resort.findMany({
      where: { status: 'PENDING' },
      include: { owner: { include: { user: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(resorts);
  } catch (error) {
    next(error);
  }
};

export const getActiveResorts = async (req, res, next) => {
  try {
    const resorts = await prisma.resort.findMany({
      where: { status: 'APPROVED' },
      include: { owner: { include: { user: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(resorts);
  } catch (error) {
    next(error);
  }
};

export const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { 
        user: true, 
        resort: true 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

export const getAllGuides = async (req, res, next) => {
  try {
    const guides = await prisma.guideProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(guides);
  } catch (error) {
    next(error);
  }
};

export const updateResortStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const resort = await prisma.resort.update({
      where: { id },
      data: { status },
      include: { owner: { include: { user: true } } }
    });
    res.json(resort);
  } catch (error) {
    next(error);
  }
};

export const getPayouts = async (req, res, next) => {
  try {
    res.json([]); // Placeholder for payouts system
  } catch (error) {
    next(error);
  }
};

export const getSecurityStats = async (req, res, next) => {
  try {
    res.json({ logs: [], activeSessions: 1 }); // Placeholder
  } catch (error) {
    next(error);
  }
};

export const getFlaggedReviews = async (req, res, next) => {
  try {
    res.json([]); // Placeholder
  } catch (error) {
    next(error);
  }
};

export const getOtpLogs = async (req, res, next) => {
  try {
    res.json([]); // Placeholder
  } catch (error) {
    next(error);
  }
};

/**
 * System Settings
 */
export const updateSettings = async (req, res, next) => {
  try {
    const { guideServiceEnabled } = req.body;
    
    // Use upsert or findFirst then update to manage the single settings record
    let settings = await prisma.systemSettings.findFirst();
    
    if (settings) {
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: { guideServiceEnabled }
      });
    } else {
      settings = await prisma.systemSettings.create({
        data: { guideServiceEnabled }
      });
    }
    
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

/**
 * Guide Visibility Management
 */
export const toggleGuideActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const guide = await prisma.guideProfile.update({
      where: { id },
      data: { isActive },
      include: { user: true }
    });
    
    res.json(guide);
  } catch (error) {
    next(error);
  }
};

export const toggleAllGuides = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    
    await prisma.guideProfile.updateMany({
      data: { isActive }
    });
    
    res.json({ success: true, isActive });
  } catch (error) {
    next(error);
  }
};
