import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, avatar, location, idType, idNumber, idImage } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { 
        name, 
        email: email?.toLowerCase(), 
        phone, 
        avatar, 
        location, 
        idType, 
        idNumber, 
        idImage,
        kycStatus: idImage ? 'PENDING' : undefined
      }
    });
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    next(error);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.userId },
      include: { resort: true, room: true },
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
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
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
    const user = await prisma.user.update({
      where: { id },
      data: { 
        name, 
        email: email?.toLowerCase(), 
        phone, 
        avatar, 
        location, 
        idType, 
        idNumber, 
        idImage,
        kycStatus: idImage ? 'PENDING' : undefined
      }
    });
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    next(error);
  }
};
