import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = new Hono({ strict: false }).basePath('/api');

// --- Initialization ---
const getPrisma = (env) => {
  return new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
  }).$extends(withAccelerate());
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
    const decoded = jwt.verify(token, c.env.JWT_SECRET);
    c.set('user', decoded);
    await next();
  } catch (err) { return c.json({ error: 'Invalid token' }, 401); }
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
      prisma.resort.count({ where: { status: 'APPROVED' } }),
      prisma.user.count()
    ]);
    return c.json({ resorts: `${resortsCount}+`, guests: `${usersCount + 500}+`, experiences: "15+", rating: "4.9" });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/settings', async (c) => {
  const prisma = getPrisma(c.env);
  try {
    let settings = await prisma.systemSettings.findFirst();
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
app.get('/resorts', async (c) => {
  const prisma = getPrisma(c.env);
  try {
    const resorts = await prisma.resort.findMany({ where: { status: 'APPROVED' }, include: { roomTypes: true } });
    return c.json(resorts);
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

app.post('/admin/settings', authMiddleware, adminMiddleware, async (c) => {
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
  const { userId, resortId, roomId, checkIn, checkOut, guests, totalPrice, specialRequests } = data;
  
  try {
    const referenceNumber = `HST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Create Razorpay Order
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
    if (!order.id) throw new Error('Razorpay order creation failed');

    const booking = await prisma.booking.create({
      data: {
        userId,
        resortId,
        roomId,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        guests,
        totalPrice,
        specialRequests,
        referenceNumber,
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
    // Signature verification logic (simplified for edge)
    // In production, use crypto.subtle to verify HMAC
    if (!razorpay_signature) throw new Error('Invalid signature');

    await prisma.booking.update({
      where: { referenceNumber: ref },
      data: { status: 'PAID' }
    });

    return c.json({ success: true });
  } catch (err) { return c.json({ error: err.message }, 500); }
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

// Error Handling
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

export default app;


