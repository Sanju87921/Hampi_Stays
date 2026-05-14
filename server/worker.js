import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = new Hono({ strict: false }).basePath('/api');

// --- Initialization ---
let prismaInstance;
const getPrisma = (env) => {
  if (prismaInstance) return prismaInstance;
  
  prismaInstance = new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
  }).$extends(withAccelerate());
  
  return prismaInstance;
};

// --- Middleware ---
app.use('*', logger());
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.FRONTEND_URL || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Auth Middlewares
const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);
  const token = authHeader.split(' ')[1];
  try {
    const secret = c.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not configured");
    const decoded = jwt.verify(token, secret);
    c.set('user', decoded);
    await next();
  } catch (err) { 
    console.error("Auth Middleware Error:", err.message);
    return c.json({ error: 'Invalid or expired token' }, 401); 
  }
};

const adminMiddleware = async (c, next) => {
  const user = c.get('user');
  if (user?.role !== 'ADMIN') return c.json({ error: 'Forbidden: Admin access required' }, 403);
  await next();
};

// --- Routes ---

// Health & Public Stats
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date() }));

app.get('/stats', async (c) => {
  const prisma = getPrisma(c.env);
  try {
    const [resortsCount, usersCount] = await Promise.all([
      prisma.resort.count({ where: { status: 'APPROVED' }, cacheStrategy: { ttl: 300 } }),
      prisma.user.count({ cacheStrategy: { ttl: 300 } })
    ]);
    return c.json({ resorts: `${resortsCount}+`, guests: `${usersCount + 500}+`, experiences: "15+", rating: "4.9" });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/settings', async (c) => {
  const prisma = getPrisma(c.env);
  try {
    let settings = await prisma.systemSettings.findFirst({ cacheStrategy: { ttl: 600 } });
    if (!settings) {
      settings = await prisma.systemSettings.create({ data: { guideServiceEnabled: true } });
    }
    return c.json(settings);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// Authentication
app.post('/auth/register', async (c) => {
  const prisma = getPrisma(c.env);
  const { name, email, password, role } = await c.req.json();
  const lowerEmail = email.toLowerCase();
  try {
    const settings = await prisma.systemSettings.findFirst();
    if (role === 'GUIDE' && settings && !settings.guideServiceEnabled) {
      return c.json({ error: 'Guide registration is currently disabled by the administrator.' }, 403);
    }

    const existing = await prisma.user.findUnique({ where: { email: lowerEmail } });
    if (existing) return c.json({ error: 'Email already registered' }, 400);
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({ data: { email: lowerEmail, name, passwordHash, role: role || 'TRAVELLER' } });
      if (role === 'RESORT_OWNER') await tx.resortOwner.create({ data: { userId: newUser.id, businessName: `${name}'s Portfolio` } });
      return newUser;
    });
    const token = jwt.sign({ userId: user.id, role: user.role }, c.env.JWT_SECRET, { expiresIn: '7d' });
    return c.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 201);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.post('/auth/login', async (c) => {
  const prisma = getPrisma(c.env);
  const { email, password } = await c.req.json();
  const lowerEmail = email.toLowerCase();
  try {
    const user = await prisma.user.findUnique({ where: { email: lowerEmail } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return c.json({ error: 'Invalid credentials' }, 401);
    const token = jwt.sign({ userId: user.id, role: user.role }, c.env.JWT_SECRET, { expiresIn: '7d' });
    return c.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/auth/me', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const payload = c.get('user');
  try {
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return c.json({ error: 'User not found' }, 404);
    return c.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// Resorts
app.get('/resorts/featured', async (c) => {
  const prisma = getPrisma(c.env);
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
        category: true,
        amenities: true
      },
      cacheStrategy: { swr: 300, ttl: 300 } // Edge cache for 5 mins
    });

    const optimizedResorts = resorts.map(r => ({
      ...r,
      images: r.images.slice(0, 1)
    }));

    return c.json(optimizedResorts);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/resorts', async (c) => {
  const prisma = getPrisma(c.env);
  const { 
    minPrice, maxPrice, type, category, 
    minRating, sort, search 
  } = c.req.query();

  try {
    const where = {
      status: 'APPROVED',
      ...(minPrice || maxPrice ? {
        pricePerNight: {
          ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
          ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
        }
      } : {}),
      ...(type ? { type } : {}),
      ...(category ? { category } : {}),
      ...(minRating ? { rating: { gte: parseFloat(minRating) } } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { locationArea: { contains: search, mode: 'insensitive' } },
          { tagline: { contains: search, mode: 'insensitive' } }
        ]
      } : {})
    };

    const orderBy = {};
    if (sort === 'price_asc') orderBy.pricePerNight = 'asc';
    else if (sort === 'price_desc') orderBy.pricePerNight = 'desc';
    else if (sort === 'rating') orderBy.rating = 'desc';
    else if (sort === 'newest') orderBy.createdAt = 'desc';
    else orderBy.reviewCount = 'desc';

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
        category: true,
        isVerified: true,
        isFeatured: true,
      },
      cacheStrategy: { swr: 60, ttl: 60 }, // Cache at the edge for 60s
    });

    const optimizedResorts = resorts.map(r => ({
      ...r,
      images: r.images.slice(0, 1)
    }));

    return c.json(optimizedResorts);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/resorts/:slug', async (c) => {
  const prisma = getPrisma(c.env);
  const slug = c.req.param('slug');
  try {
    const resort = await prisma.resort.findUnique({
      where: { slug },
      include: { roomTypes: true, owner: { include: { user: true } } }
    });
    if (!resort) return c.json({ error: 'Resort not found' }, 404);
    return c.json(resort);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.post('/resorts', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const data = await c.req.json();
  const payload = c.get('user');
  
  try {
    const { name, tagline, description, type, area, price, amenities, category, roomTypes, images, mealPackages, houseRules, documents } = data;
    const ownerId = payload.userId;
    
    const owner = await prisma.resortOwner.findUnique({ where: { userId: ownerId } });
    if (!owner) return c.json({ error: 'Resort owner profile not found. Please complete owner registration.' }, 403);

    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.random().toString(36).substring(2, 7);
    
    const resort = await prisma.resort.create({
      data: {
        name,
        slug,
        tagline,
        description,
        type: type || 'luxury',
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

    return c.json(resort, 201);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/owners/:id/resorts', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const userId = c.req.param('id');
  try {
    const owner = await prisma.resortOwner.findUnique({ where: { userId } });
    if (!owner) return c.json([]);
    const resorts = await prisma.resort.findMany({
      where: { ownerId: owner.id },
      include: { 
        roomTypes: true, 
        bookings: { 
          include: { user: true, room: true },
          orderBy: { createdAt: 'desc' }
        } 
      }
    });
    return c.json(resorts);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.delete('/resorts/:id', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  const payload = c.get('user');
  
  try {
    const resort = await prisma.resort.findUnique({ 
      where: { id },
      include: { owner: true }
    });
    
    if (!resort) return c.json({ error: 'Resort not found' }, 404);
    if (resort.owner.userId !== payload.userId && payload.role !== 'ADMIN') {
      return c.json({ error: 'Unauthorized to delete this resort' }, 403);
    }

    await prisma.resort.delete({ where: { id } });
    return c.json({ success: true });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// --- Admin Section ---
app.get('/admin/stats', authMiddleware, adminMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  try {
    const [userCount, resortCount, bookingCount, revenueData] = await Promise.all([
      prisma.user.count(),
      prisma.resort.count(),
      prisma.booking.count(),
      prisma.booking.findMany({
        where: { status: { in: ['PAID', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED'] } },
        select: { totalPrice: true, commissionRate: true }
      })
    ]);

    const totalRevenue = revenueData.reduce((sum, b) => sum + b.totalPrice, 0);
    const platformEarnings = revenueData.reduce((sum, b) => sum + (b.totalPrice * (b.commissionRate / 100)), 0);

    return c.json({
      userCount,
      resortCount,
      bookingCount,
      revenue: totalRevenue,
      platformEarnings: platformEarnings,
      platformRating: 4.9,
      avgBookingValue: bookingCount > 0 ? totalRevenue / bookingCount : 0
    });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.on(['POST', 'PATCH'], '/admin/settings', authMiddleware, adminMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const { guideServiceEnabled, defaultCommissionRate } = await c.req.json();
  try {
    let settings = await prisma.systemSettings.findFirst();
    const data = {};
    if (guideServiceEnabled !== undefined) data.guideServiceEnabled = guideServiceEnabled;
    if (defaultCommissionRate !== undefined) data.defaultCommissionRate = defaultCommissionRate;

    if (settings) {
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data
      });
    } else {
      settings = await prisma.systemSettings.create({ data: { guideServiceEnabled: true, defaultCommissionRate: 7.0, ...data } });
    }
    return c.json(settings);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// User Management
app.get('/admin/users', authMiddleware, adminMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
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
        kycStatus: true,
        avatar: true
      }
    });
    return c.json(users);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.delete('/admin/users/:id', authMiddleware, adminMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  try {
    await prisma.user.delete({ where: { id } });
    return c.json({ success: true });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// Resort Management
app.get('/admin/resorts/pending', authMiddleware, adminMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  try {
    const resorts = await prisma.resort.findMany({
      where: { status: 'PENDING' },
      include: { owner: { include: { user: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return c.json(resorts);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/admin/resorts/active', authMiddleware, adminMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  try {
    const resorts = await prisma.resort.findMany({
      where: { status: 'APPROVED' },
      include: { owner: { include: { user: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return c.json(resorts);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.patch('/admin/resorts/:id/status', authMiddleware, adminMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  const { status } = await c.req.json();
  try {
    const resort = await prisma.resort.update({ where: { id }, data: { status } });
    return c.json(resort);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.patch('/admin/resorts/:id/commission', authMiddleware, adminMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  const { commissionRate } = await c.req.json();
  try {
    const resort = await prisma.resort.update({ where: { id }, data: { commissionRate } });
    return c.json(resort);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.patch('/admin/resorts/:id/feature', authMiddleware, adminMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  const { isFeatured } = await c.req.json();
  try {
    const resort = await prisma.resort.update({ where: { id }, data: { isFeatured } });
    return c.json(resort);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// Booking Management
app.get('/admin/bookings/all', authMiddleware, adminMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  try {
    const bookings = await prisma.booking.findMany({
      include: { user: true, resort: true },
      orderBy: { createdAt: 'desc' }
    });
    return c.json(bookings);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// Guide Management
app.get('/admin/guides', authMiddleware, adminMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  try {
    const guides = await prisma.guideProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
    return c.json(guides);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.patch('/admin/guides/:id/status', authMiddleware, adminMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  const { status } = await c.req.json();
  try {
    const guide = await prisma.guideProfile.update({ where: { id }, data: { status } });
    return c.json(guide);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.patch('/admin/guides/:id/toggle-active', authMiddleware, adminMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  const { isActive } = await c.req.json();
  try {
    const guide = await prisma.guideProfile.update({ where: { id }, data: { isActive } });
    return c.json(guide);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// Stubs for remaining dashboard tabs
app.get('/admin/payouts', authMiddleware, adminMiddleware, (c) => c.json([]));
app.get('/admin/security/stats', authMiddleware, adminMiddleware, (c) => c.json({ logs: [], activeSessions: 1 }));
app.get('/admin/reviews/flagged', authMiddleware, adminMiddleware, (c) => c.json([]));
app.get('/admin/otp-logs', authMiddleware, adminMiddleware, (c) => c.json([]));

// Bookings & Payments
app.post('/bookings', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const data = await c.req.json();
  const { resortId, roomId, checkIn, checkOut, guests, specialRequests, addInsurance, airportPickup } = data;
  const payload = c.get('user');
  
  try {
    // 1. RECALCULATE PRICE FOR SECURITY
    const resort = await prisma.resort.findUnique({ 
      where: { id: resortId },
      include: { roomTypes: true }
    });
    
    if (!resort) return c.json({ error: 'Resort not found' }, 404);
    
    const room = resort.roomTypes.find(r => r.id === roomId);
    if (!room) return c.json({ error: 'Room type not found' }, 404);

    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    const nights = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const nightsTotal = room.pricePerNight * nights;
    const taxes = Math.round(nightsTotal * 0.12);
    const insuranceCost = addInsurance ? Math.round(nightsTotal * 0.02) : 0;
    const airportPickupCost = airportPickup ? 800 : 0;
    const totalPrice = nightsTotal + taxes + insuranceCost + airportPickupCost;

    const referenceNumber = `HST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // 2. Create Razorpay Order
    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${c.env.RAZORPAY_KEY_ID}:${c.env.RAZORPAY_KEY_SECRET}`)}`
      },
      body: JSON.stringify({
        amount: Math.round(totalPrice * 100),
        currency: 'INR',
        receipt: referenceNumber
      })
    });
    
    const order = await rzpResponse.json();
    if (!order.id) {
      console.error("Razorpay Error:", order);
      throw new Error(order.error?.description || 'Razorpay order creation failed');
    }

    const booking = await prisma.booking.create({
      data: {
        userId: payload.userId,
        resortId,
        roomId,
        checkIn: startDate,
        checkOut: endDate,
        guests: parseInt(guests) || 1,
        totalPrice,
        specialRequests,
        referenceNumber,
        commissionRate: resort.commissionRate || 7.0,
        status: 'PENDING'
      }
    });

    return c.json({ ...booking, orderId: order.id });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.post('/bookings/:ref/verify-payment', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const ref = c.req.param('ref');
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await c.req.json();
  
  try {
    // 1. Secure Signature Verification using Web Crypto API
    const secret = c.env.RAZORPAY_KEY_SECRET;
    const encoder = new TextEncoder();
    const data = encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`);
    const key = await crypto.subtle.importKey(
      'raw', 
      encoder.encode(secret), 
      { name: 'HMAC', hash: 'SHA-256' }, 
      false, 
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, data);
    const generatedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (generatedSignature !== razorpay_signature) {
      return c.json({ error: 'Invalid payment signature. Potential fraud detected.' }, 400);
    }

    // 2. Update Booking Status
    const booking = await prisma.booking.update({
      where: { referenceNumber: ref },
      data: { status: 'PAID' },
      include: { resort: true }
    });

    // 3. Create Notification
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: 'Booking Confirmed!',
        message: `Payment successful for ${booking.resort.name}. Reference: ${ref}`,
        type: 'booking'
      }
    });

    return c.json({ success: true, booking });
  } catch (err) { 
    console.error("Verification Error:", err.message);
    return c.json({ error: err.message }, 500); 
  }
});

// Cloudinary Upload
app.post('/upload', authMiddleware, async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('image');
  if (!file) return c.json({ error: 'No image provided' }, 400);

  try {
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', 'ml_default'); // You might need to change this
    uploadData.append('cloud_name', c.env.CLOUDINARY_CLOUD_NAME);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${c.env.CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: uploadData
    });

    const result = await response.json();
    return c.json({ url: result.secure_url });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// Heritage & Discovery
app.get('/heritage/poi', (c) => {
  return c.json([
    {
      id: "vittala",
      name: "Vittala Temple",
      category: "Architecture",
      x: 75,
      y: 35,
      description: "The architectural showpiece of Hampi, famous for its stone chariot and musical pillars.",
      image: "https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=1200",
      recommendedTours: ["Sunrise Chariot Walk", "Musical Pillars Acoustic Session"],
      nearbyResort: "Evolve Back Kamalapura Palace"
    },
    {
      id: "virupaksha",
      name: "Virupaksha Temple",
      category: "Heritage",
      x: 25,
      y: 45,
      description: "The oldest functioning temple in Hampi, dedicated to Lord Shiva with its 50-meter gopuram.",
      image: "https://images.unsplash.com/photo-1581012771300-224937651c42?auto=format&fit=crop&q=80&w=1200",
      recommendedTours: ["Evening Aarti Experience", "Sacred Hampi Pilgrimage"],
      nearbyResort: "Hampi's Boulders Resort"
    },
    {
      id: "hemakuta",
      name: "Hemakuta Hill",
      category: "Nature",
      x: 35,
      y: 55,
      description: "A sunset lover's paradise offering panoramic views of the temple ruins and boulder landscape.",
      image: "https://images.unsplash.com/photo-1590050752117-23a9d7f28a97?auto=format&fit=crop&q=80&w=1200",
      recommendedTours: ["Sunset Photography Hike", "Meditation on the Rocks"],
      nearbyResort: "Heritage Resort Hampi"
    },
    {
      id: "lotus",
      name: "Lotus Mahal",
      category: "Architecture",
      x: 60,
      y: 65,
      description: "A stunning two-story structure featuring a blend of Indo-Islamic architecture in the Zenana Enclosure.",
      image: "https://images.unsplash.com/photo-1524230652367-a7ff3337f7e7?auto=format&fit=crop&q=80&w=1200",
      recommendedTours: ["Royal Zenana Tour", "Indo-Islamic History Walk"],
      nearbyResort: "Kishkinda Heritage Resort"
    }
  ]);
});

// Error Handling
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

export default app;


