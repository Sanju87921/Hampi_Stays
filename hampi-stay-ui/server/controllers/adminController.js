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
      platformRating: 4.8
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
    
    // Prevent self-deletion if needed, or other safety checks
    
    await prisma.$transaction([
      prisma.booking.deleteMany({ where: { userId: id } }),
      prisma.wishlist.deleteMany({ where: { userId: id } }),
      prisma.review.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } })
    ]);
    
    res.json({ success: true, message: 'User and associated data deleted' });
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
    
    await prisma.notification.create({
      data: {
        userId: resort.owner.userId,
        title: status === 'APPROVED' ? 'Resort Approved!' : 'Resort Update Required',
        message: status === 'APPROVED' 
          ? `Congratulations! ${resort.name} is now live on HampiStays.`
          : `Your resort listing ${resort.name} needs some changes before it can be approved.`,
        type: 'info'
      }
    });

    res.json(resort);
  } catch (error) {
    next(error);
  }
};
