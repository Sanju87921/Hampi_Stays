import prisma from '../utils/prisma.js';

/**
 * Get all resorts for a specific owner (by user ID)
 */
export const getOwnerResorts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Find the resort owner profile for this user
    const owner = await prisma.resortOwner.findUnique({
      where: { userId },
      include: {
        resorts: {
          include: {
            roomTypes: {
              include: {
                priceOverrides: true,
                blockings: true
              }
            },
            bookings: {
              include: {
                user: true
              }
            },
            discountCodes: true
          }
        }
      }
    });

    if (!owner) {
      return res.json([]);
    }

    const resortsWithFallback = owner.resorts.map(r => ({
      ...r,
      category: r.categories[0] || null
    }));

    res.json(resortsWithFallback);
  } catch (error) {
    next(error);
  }
};

/**
 * Get owner profile (user + owner record) by userId
 */
export const getOwnerProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Security: only allow owner to see their own profile or admin
    if (req.user.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const [user, owner] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, avatar: true, phone: true, location: true, kycStatus: true, idType: true, idNumber: true, idImage: true }
      }),
      prisma.resortOwner.findUnique({
        where: { userId },
        select: { id: true, businessName: true, gstNumber: true, isVerified: true }
      })
    ]);

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ ...user, ownerProfile: owner });
  } catch (error) {
    next(error);
  }
};

/**
 * Update owner profile (user fields + owner business fields)
 */
export const updateOwnerProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Security: only allow owner to update their own profile or admin
    if (req.user.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to update this profile' });
    }

    const { name, phone, avatar, location, idType, idNumber, idImage, businessName, gstNumber } = req.body;

    // Update User fields
    const userData = {};
    if (name !== undefined) userData.name = name;
    if (phone !== undefined) userData.phone = phone;
    if (avatar !== undefined) userData.avatar = avatar;
    if (location !== undefined) userData.location = location;
    if (idType !== undefined) userData.idType = idType;
    if (idNumber !== undefined) userData.idNumber = idNumber;
    if (idImage !== undefined) {
      userData.idImage = idImage;
      const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { idImage: true, kycStatus: true } });
      if (idImage && idImage !== currentUser?.idImage && currentUser?.kycStatus !== 'VERIFIED') {
        userData.kycStatus = 'PENDING';
      }
    }

    // Update ResortOwner profile fields
    const ownerData = {};
    if (businessName !== undefined) ownerData.businessName = businessName;
    if (gstNumber !== undefined) ownerData.gstNumber = gstNumber;

    const [updatedUser] = await Promise.all([
      Object.keys(userData).length > 0
        ? prisma.user.update({ where: { id: userId }, data: userData })
        : prisma.user.findUnique({ where: { id: userId } }),
      Object.keys(ownerData).length > 0
        ? prisma.resortOwner.upsert({
            where: { userId },
            update: ownerData,
            create: { userId, ...ownerData }
          })
        : Promise.resolve(null)
    ]);

    const ownerProfile = await prisma.resortOwner.findUnique({
      where: { userId },
      select: { id: true, businessName: true, gstNumber: true, isVerified: true }
    });

    const { passwordHash, ...safeUser } = updatedUser;
    res.json({ ...safeUser, ownerProfile });
  } catch (error) {
    next(error);
  }
};

/**
 * Get owner dashboard stats
 */
export const getOwnerStats = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const owner = await prisma.resortOwner.findUnique({
      where: { userId },
      include: {
        resorts: {
          include: {
            bookings: true
          }
        }
      }
    });

    if (!owner) return res.json({ revenue: 0, bookings: 0, rating: 0 });

    const resorts = owner.resorts;
    const totalRevenue = resorts.reduce((sum, r) => 
      sum + r.bookings.reduce((bSum, b) => bSum + (b.status !== 'CANCELLED' ? b.totalPrice : 0), 0)
    , 0);
    const totalBookings = resorts.reduce((sum, r) => sum + r.bookings.length, 0);
    const avgRating = resorts.reduce((sum, r) => sum + (r.rating || 5), 0) / (resorts.length || 1);

    res.json({
      revenue: totalRevenue,
      bookings: totalBookings,
      rating: avgRating.toFixed(1)
    });
  } catch (error) {
    next(error);
  }
};
