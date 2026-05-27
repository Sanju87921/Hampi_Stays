import prisma from '../utils/prisma.js';

// Helper to strip sensitive fields
const safeUser = (user) => {
  const { passwordHash, ...safe } = user;

  // Compute profile completion status dynamically
  let isComplete = false;
  if (user.role === 'TRAVELLER') {
    isComplete = !!(user.name && user.email && user.phone && user.location && user.avatar);
  } else if (user.role === 'GUIDE') {
    const hasKyc = user.kycStatus === 'PENDING' || user.kycStatus === 'VERIFIED';
    isComplete = !!(user.name && user.phone && user.location && user.avatar && hasKyc);
  } else if (user.role === 'RESORT_OWNER') {
    isComplete = !!(user.name && user.email && user.phone && user.location && user.avatar);
  } else {
    isComplete = !!(user.name && user.email);
  }

  safe.profileCompletionStatus = isComplete ? 'COMPLETE' : 'INCOMPLETE';
  return safe;
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(safeUser(user));
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, avatar, location, idType, idNumber, idImage } = req.body;

    // Only include fields that are actually provided (not undefined)
    const data = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email.toLowerCase();
    if (phone !== undefined) data.phone = phone;
    if (avatar !== undefined) data.avatar = avatar;
    if (location !== undefined) data.location = location;
    if (idType !== undefined) data.idType = idType;
    if (idNumber !== undefined) data.idNumber = idNumber;
    if (idImage !== undefined) {
      const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { idImage: true, kycStatus: true, name: true } });
      if (idImage && idImage !== currentUser?.idImage) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const submissionCount = await prisma.verificationAudit.count({
          where: {
            targetUserId: req.user.userId,
            action: { in: ['SUBMITTED', 'RESUBMITTED'] },
            createdAt: { gte: oneDayAgo }
          }
        });

        if (submissionCount >= 5) {
          return res.status(429).json({ error: 'Too many KYC submissions. You can only submit your KYC documents 5 times per day.' });
        }

        data.idImage = idImage;
        const previousStatus = currentUser?.kycStatus || 'NOT_SUBMITTED';
        const targetStatus = previousStatus === 'REJECTED' ? 'RESUBMITTED' : 'PENDING';
        data.kycStatus = targetStatus;

        // Log VerificationAudit trail
        await prisma.verificationAudit.create({
          data: {
            adminId: 'USER_SELF',
            adminName: name || currentUser?.name || 'User Self',
            targetUserId: req.user.userId,
            targetName: name || currentUser?.name || 'User Self',
            targetType: 'USER',
            action: previousStatus === 'REJECTED' ? 'RESUBMITTED' : 'SUBMITTED',
            previousStatus,
            newStatus: targetStatus,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
            userAgent: req.headers['user-agent'] || null
          }
        });
      } else {
        data.idImage = idImage;
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data
    });
    res.json(safeUser(user));
  } catch (error) {
    next(error);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.userId },
      include: {
        resort: {
          select: {
            id: true,
            name: true,
            slug: true,
            tagline: true,
            type: true,
            locationArea: true,
            locationLat: true,
            locationLng: true,
            images: true,
            rating: true,
            reviewCount: true,
            pricePerNight: true
          }
        },
        room: {
          select: {
            id: true,
            name: true,
            pricePerNight: true
          }
        }
      },
      orderBy: { checkIn: 'asc' }
    });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(safeUser(user));
  } catch (error) {
    next(error);
  }
};

export const updateUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Security: Only allow users to update their own profile unless they are ADMIN
    if (req.user.userId !== id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to update this profile' });
    }

    const { name, email, phone, avatar, location, idType, idNumber, idImage } = req.body;

    // Only update fields that are explicitly provided
    const data = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email.toLowerCase();
    if (phone !== undefined) data.phone = phone;
    if (avatar !== undefined) data.avatar = avatar;
    if (location !== undefined) data.location = location;
    if (idType !== undefined) data.idType = idType;
    if (idNumber !== undefined) data.idNumber = idNumber;
    if (idImage !== undefined) {
      data.idImage = idImage;
      // Only set kycStatus to PENDING if a new document is being uploaded
      const currentUser = await prisma.user.findUnique({ where: { id }, select: { idImage: true, kycStatus: true } });
      if (idImage && idImage !== currentUser?.idImage && currentUser?.kycStatus !== 'VERIFIED') {
        data.kycStatus = 'PENDING';
      }
    }

    const user = await prisma.user.update({ where: { id }, data });
    res.json(safeUser(user));
  } catch (error) {
    next(error);
  }
};
