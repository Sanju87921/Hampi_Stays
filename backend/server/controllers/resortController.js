import crypto from 'crypto';
import prisma from '../utils/prisma.js';

export const getAllResorts = async (req, res, next) => {
  try {
    const { 
      minPrice, maxPrice, type, category, 
      minRating, sort, search 
    } = req.query;

    let categoriesQuery = [];
    if (category) {
      if (Array.isArray(category)) {
        categoriesQuery = category;
      } else if (typeof category === 'string') {
        if (category.startsWith('[') && category.endsWith(']')) {
          try {
            categoriesQuery = JSON.parse(category);
          } catch (e) {
            categoriesQuery = category.split(',').map(c => c.trim()).filter(Boolean);
          }
        } else {
          categoriesQuery = category.split(',').map(c => c.trim()).filter(Boolean);
        }
      }
    }

    const where = {
      status: 'APPROVED',
      ...(minPrice || maxPrice ? {
        pricePerNight: {
          ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
          ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
        }
      } : {}),
      ...(type ? { type } : {}),
      ...(categoriesQuery.length > 0 ? {
        categories: {
          hasEvery: categoriesQuery
        }
      } : {}),
      ...(minRating ? { rating: { gte: parseFloat(minRating) } } : {})
    };

    const orderBy = {};
    if (sort === 'price_asc') orderBy.pricePerNight = 'asc';
    else if (sort === 'price_desc') orderBy.pricePerNight = 'desc';
    else if (sort === 'rating') orderBy.rating = 'desc';
    else if (sort === 'newest') orderBy.createdAt = 'desc';
    else orderBy.reviewCount = 'desc'; // popularity

    const resorts = await prisma.resort.findMany({
      where,
      orderBy,
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        type: true,
        locationArea: true,
        images: true,
        amenities: true,
        rating: true,
        reviewCount: true,
        pricePerNight: true,
        categories: true,
        isVerified: true,
        isFeatured: true,
      }
    });

    let filteredResorts = resorts;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredResorts = resorts.filter(r => 
        r.name.toLowerCase().includes(searchLower) ||
        r.locationArea.toLowerCase().includes(searchLower) ||
        r.tagline.toLowerCase().includes(searchLower) ||
        (r.categories || []).some(cat => cat.toLowerCase().includes(searchLower))
      );
    }

    // Post-process to only send the first image to save bandwidth
    const optimizedResorts = filteredResorts.map(r => ({
      ...r,
      category: r.categories[0] || null, // fallback
      images: r.images.slice(0, 1) // Only send cover image for listing
    }));

    res.json(optimizedResorts);
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
    
    // Add legacy fallback for category
    const resortWithFallback = {
      ...resort,
      category: resort.categories[0] || null
    };

    res.json(resortWithFallback);
  } catch (error) {
    next(error);
  }
};

export const createResort = async (req, res, next) => {
  try {
    const { name, tagline, description, type, area, price, amenities, category, categories, roomTypes, images, mealPackages, houseRules, documents } = req.body;
    const ownerId = req.user.userId; // Secure: get from token
    
    const owner = await prisma.resortOwner.findUnique({ where: { userId: ownerId } });
    if (!owner) return res.status(403).json({ error: 'Resort owner profile not found' });

    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + crypto.randomBytes(3).toString('hex');
    
    const rawCategories = categories || (category ? [category] : []);
    const sanitizedCategories = Array.from(
      new Set(
        rawCategories
          .map(c => typeof c === 'string' ? c.trim() : '')
          .filter(c => c.length > 0 && c.length <= 30)
          .map(c => c.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
      )
    );

    const resort = await prisma.resort.create({
      data: {
        name, slug, tagline, description, type: type || 'luxury',
        categories: sanitizedCategories,
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
      where: { status: 'APPROVED', isFeatured: true },
      take: 3,
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        locationArea: true,
        images: true,
        rating: true,
        pricePerNight: true,
        categories: true
      }
    });
    
    const optimizedResorts = resorts.map(r => ({
      ...r,
      category: r.categories[0] || null, // fallback
      images: r.images.slice(0, 1)
    }));

    res.json(optimizedResorts);
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

export const getResortCategories = async (req, res, next) => {
  try {
    const resorts = await prisma.resort.findMany({
      where: { status: 'APPROVED' },
      select: { categories: true }
    });
    const categories = Array.from(new Set(resorts.flatMap(r => r.categories || [])));
    res.json(categories);
  } catch (error) {
    next(error);
  }
};
