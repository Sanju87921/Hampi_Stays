import prisma from '../utils/prisma.js';

export const getAllGuides = async (req, res, next) => {
  try {
    const guides = await prisma.guideProfile.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          }
        },
        experiences: true
      }
    });
    res.json(guides);
  } catch (error) {
    next(error);
  }
};

export const getGuideById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const guide = await prisma.guideProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          }
        },
        experiences: true
      }
    });
    if (!guide) return res.status(404).json({ error: 'Guide not found' });
    res.json(guide);
  } catch (error) {
    next(error);
  }
};

export const bookGuide = async (req, res, next) => {
  try {
    const { guideId } = req.params;
    const { userId, date, durationHours, meetingPoint, totalPrice, specialRequests } = req.body;

    const booking = await prisma.guideBooking.create({
      data: {
        guideId,
        userId,
        date: new Date(date),
        durationHours,
        meetingPoint,
        totalPrice,
        specialRequests,
        status: 'PENDING'
      }
    });

    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};

export const getGuideProfileByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    let guide = await prisma.guideProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
            location: true,
            kycStatus: true,
          }
        },
        experiences: true
      }
    });

    if (!guide) {
      // Check if user exists and is a guide
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (user.role !== 'GUIDE') {
        return res.status(400).json({ error: 'User is not a guide' });
      }

      // Create a guide profile with default values if it doesn't exist
      guide = await prisma.guideProfile.create({
        data: {
          userId,
          bio: "Certified Hampi Expert dedicated to sharing the majestic history of the Vijayanagara Empire.",
          specialties: ["Architecture", "History"],
          languages: ["English", "Kannada"],
          pricePerDay: 2500,
          pricePerHour: 500,
          yearsExperience: 0,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              phone: true,
              location: true,
              kycStatus: true,
            }
          },
          experiences: true
        }
      });
    }

    res.json(guide);
  } catch (error) {
    next(error);
  }
};

export const updateGuideProfileByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Security check: only allow updating own profile or admin
    if (req.user.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to update this profile' });
    }

    const { bio, pricePerDay, pricePerHour, specialties, languages, idType, idNumber, idImage, avatar, name, phone } = req.body;

    // Check if GuideProfile exists
    let guide = await prisma.guideProfile.findUnique({ where: { userId } });
    if (!guide) {
      return res.status(404).json({ error: 'Guide profile not found' });
    }

    // Build GuideProfile update — only include explicitly provided fields
    const guideData = {};
    if (bio !== undefined) guideData.bio = bio;
    if (pricePerDay !== undefined) guideData.pricePerDay = parseFloat(pricePerDay);
    if (pricePerHour !== undefined) guideData.pricePerHour = parseFloat(pricePerHour);
    if (specialties !== undefined) guideData.specialties = specialties;
    if (languages !== undefined) guideData.languages = languages;
    if (idType !== undefined) guideData.idType = idType;
    if (idNumber !== undefined) guideData.idNumber = idNumber;
    if (idImage !== undefined) {
      guideData.idImage = idImage;
      // Only mark as pending when a NEW document is uploaded
      if (idImage && idImage !== guide.idImage && guide.status !== 'APPROVED') {
        guideData.status = 'PENDING';
      }
    }

    // Update GuideProfile
    const updatedGuide = await prisma.guideProfile.update({
      where: { userId },
      data: guideData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
            location: true,
            kycStatus: true,
          }
        },
        experiences: true
      }
    });

    // Also sync User record: name, phone, avatar, idType, idNumber, idImage, kycStatus
    const userData = {};
    if (name !== undefined) userData.name = name;
    if (phone !== undefined) userData.phone = phone;
    if (avatar !== undefined) userData.avatar = avatar;
    if (idType !== undefined) userData.idType = idType;
    if (idNumber !== undefined) userData.idNumber = idNumber;
    if (idImage !== undefined) {
      userData.idImage = idImage;
      const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { idImage: true, kycStatus: true } });
      if (idImage && idImage !== currentUser?.idImage && currentUser?.kycStatus !== 'VERIFIED') {
        userData.kycStatus = 'PENDING';
      }
    }

    if (Object.keys(userData).length > 0) {
      await prisma.user.update({ where: { id: userId }, data: userData });
    }

    res.json(updatedGuide);
  } catch (error) {
    next(error);
  }
};

export const getGuideBookings = async (req, res, next) => {
  try {
    const { id: guideId } = req.params;
    
    // Retrieve bookings for this guide
    const bookings = await prisma.guideBooking.findMany({
      where: { guideId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

export const updateGuideBookingStatus = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    // Fetch the booking first to verify authorization
    const existingBooking = await prisma.guideBooking.findUnique({
      where: { id: bookingId },
      include: { guide: true }
    });

    if (!existingBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Auth check: user who booked, guide themselves, or admin
    if (
      req.user.userId !== existingBooking.userId &&
      req.user.userId !== existingBooking.guide.userId &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({ error: 'Unauthorized to update this booking' });
    }

    const booking = await prisma.guideBooking.update({
      where: { id: bookingId },
      data: { status }
    });

    res.json(booking);
  } catch (error) {
    next(error);
  }
};
