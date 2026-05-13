import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const getAllResorts = async (req, res, next) => {
  try {
    const resorts = await prisma.resort.findMany({
      where: { status: 'APPROVED' },
      include: { roomTypes: true }
    });
    res.json(resorts);
  } catch (error) {
    next(error);
  }
};

export const getResortBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const resort = await prisma.resort.findUnique({
      where: { slug },
      include: { 
        roomTypes: {
          include: {
            priceOverrides: true,
            blockings: true
          }
        },
        discountCodes: true
      }
    });
    if (!resort) return res.status(404).json({ error: 'Resort not found' });
    res.json(resort);
  } catch (error) {
    next(error);
  }
};

export const createResort = async (req, res, next) => {
  try {
    const { name, tagline, description, type, area, price, amenities, category, roomTypes, images, mealPackages, houseRules, documents } = req.body;
    const ownerId = req.user.userId; // Secure: get from token
    
    const owner = await prisma.resortOwner.findUnique({ where: { userId: ownerId } });
    if (!owner) return res.status(403).json({ error: 'Resort owner profile not found' });

    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + crypto.randomBytes(3).toString('hex');
    
    const resort = await prisma.resort.create({
      data: {
        name, slug, tagline, description, type: type || 'luxury',
        category: category || 'Heritage',
        locationArea: area,
        locationLat: 15.3350,
        locationLng: 76.4600,
        pricePerNight: parseFloat(price) || 0,
        amenities: amenities || [],
        houseRules: houseRules || [],
        mealPackages: mealPackages || [],
        verificationDocs: documents || [],
        ownerId: owner.id,
        status: 'PENDING',
        images: images || [],
        roomTypes: {
          create: (roomTypes || []).map((room) => ({
            name: room.name,
            description: room.description,
            pricePerNight: parseFloat(room.pricePerNight),
            capacity: parseInt(room.capacity),
            availableCount: parseInt(room.availableCount),
            images: []
          }))
        }
      }
    });

    res.status(201).json(resort);
  } catch (error) {
    next(error);
  }
};

export const getFeaturedResorts = async (req, res, next) => {
  try {
    const resorts = await prisma.resort.findMany({
      where: { status: 'APPROVED' },
      take: 3,
      include: { roomTypes: true }
    });
    res.json(resorts);
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const [resortsCount, usersCount, bookingsCount] = await Promise.all([
      prisma.resort.count({ where: { status: 'APPROVED' } }),
      prisma.user.count(),
      prisma.booking.count({ where: { status: 'CONFIRMED' } })
    ]);

    res.json({
      resorts: `${resortsCount}+`,
      guests: `${(usersCount + 500)}+`, // Adding base for marketing
      experiences: "15+",
      rating: "4.9"
    });
  } catch (error) {
    next(error);
  }
};
