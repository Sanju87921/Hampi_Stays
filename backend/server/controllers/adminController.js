import prisma from '../utils/prisma.js';

export const getStats = async (req, res, next) => {
  try {
    const [userCount, resortCount, bookingCount, revenueData] = await Promise.all([
      prisma.user.count(),
      prisma.resort.count(),
      prisma.booking.count(),
      prisma.booking.findMany({
        where: {
          status: {
            in: ['PAID', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED']
          }
        },
        select: {
          totalPrice: true,
          commissionRate: true
        }
      })
    ]);

    const totalRevenue = revenueData.reduce((sum, b) => sum + b.totalPrice, 0);
    const platformEarnings = revenueData.reduce((sum, b) => sum + (b.totalPrice * (b.commissionRate / 100)), 0);

    res.json({
      userCount,
      resortCount,
      bookingCount,
      revenue: totalRevenue,
      platformEarnings: platformEarnings,
      platformRating: 4.8,
      avgBookingValue: bookingCount > 0 ? totalRevenue / bookingCount : 0,
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
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        description: true,
        type: true,
        locationArea: true,
        locationLat: true,
        locationLng: true,
        images: true,
        amenities: true,
        rating: true,
        reviewCount: true,
        pricePerNight: true,
        isFeatured: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        categories: true,
        houseRules: true,
        mealPackages: true,
        status: true,
        commissionRate: true,
        owner: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                phone: true,
                createdAt: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mappedResorts = resorts.map(r => ({
      ...r,
      category: r.categories[0] || null
    }));

    res.json(mappedResorts);
  } catch (error) {
    next(error);
  }
};

export const getActiveResorts = async (req, res, next) => {
  try {
    const resorts = await prisma.resort.findMany({
      where: { status: 'APPROVED' },
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        description: true,
        type: true,
        locationArea: true,
        locationLat: true,
        locationLng: true,
        images: true,
        amenities: true,
        rating: true,
        reviewCount: true,
        pricePerNight: true,
        isFeatured: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        categories: true,
        houseRules: true,
        mealPackages: true,
        status: true,
        commissionRate: true,
        owner: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                phone: true,
                createdAt: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mappedResorts = resorts.map(r => ({
      ...r,
      category: r.categories[0] || null
    }));

    res.json(mappedResorts);
  } catch (error) {
    next(error);
  }
};

export const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        guests: true,
        totalPrice: true,
        status: true,
        specialRequests: true,
        referenceNumber: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        resortId: true,
        roomId: true,
        commissionRate: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            phone: true,
            kycStatus: true
          }
        },
        resort: {
          select: {
            id: true,
            name: true
          }
        },
        room: {
          select: {
            id: true,
            name: true
          }
        }
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
      include: { owner: { include: { user: { select: { id: true, name: true, email: true, avatar: true, phone: true, createdAt: true } } } } }
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
      include: { user: { select: { id: true, name: true, email: true, avatar: true, phone: true } } }
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

export const updateGuideStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const guide = await prisma.guideProfile.update({
      where: { id },
      data: { status },
      include: { user: true }
    });

    if (guide.userId) {
      await prisma.user.update({
        where: { id: guide.userId },
        data: { kycStatus: status }
      });
    }

    res.json(guide);
  } catch (error) {
    next(error);
  }
};
