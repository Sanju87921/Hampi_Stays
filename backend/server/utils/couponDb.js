import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let __filename = '';
let __dirname = '';
let DATA_DIR = '';
let COUPONS_FILE = '';
let BOOKING_COUPONS_FILE = '';

try {
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
    DATA_DIR = path.join(__dirname, '../data');
    COUPONS_FILE = path.join(DATA_DIR, 'coupons.json');
    BOOKING_COUPONS_FILE = path.join(DATA_DIR, 'booking_coupons.json');
  }
} catch (err) {
  // Safe ignore if URL or fileURLToPath is unavailable in workers
}

// Memory fallback cache if fs write fails (e.g. in Cloudflare Worker environment)
let couponsMemoryCache = null;
let bookingCouponsMemoryCache = null;


// Ensure data directory and files exist if running in standard Node env
try {
  if (DATA_DIR && fs.existsSync) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (COUPONS_FILE && !fs.existsSync(COUPONS_FILE)) {
      fs.writeFileSync(COUPONS_FILE, JSON.stringify([], null, 2));
    }
    if (BOOKING_COUPONS_FILE && !fs.existsSync(BOOKING_COUPONS_FILE)) {
      fs.writeFileSync(BOOKING_COUPONS_FILE, JSON.stringify([], null, 2));
    }
  }
} catch (err) {
  // Safe ignore in serverless/edge runtimes where fs isn't fully available
}

function getInitialSeededCoupons() {
  return [
    {
      id: "wel-10",
      code: 'WELCOME10',
      description: 'Get 10% off on your retreat, up to ₹2,000.',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minimumAmount: 5000,
      maxDiscount: 2000,
      usageLimit: 500,
      usedCount: 0,
      startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      applicableResortId: null,
      applicableRole: null
    },
    {
      id: "fst-stay",
      code: 'FIRSTSTAY',
      description: 'Exclusive ₹1,500 off on your very first booking at HampiStays.',
      discountType: 'FIXED',
      discountValue: 1500,
      minimumAmount: 8000,
      usageLimit: 1000,
      usedCount: 0,
      startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      applicableResortId: null,
      applicableRole: null
    },
    {
      id: "vip-stays",
      code: 'VIPSTAYS',
      description: 'Elite 20% off for VIP travellers, up to ₹5,000.',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minimumAmount: 15000,
      maxDiscount: 5000,
      usedCount: 0,
      applicableRole: 'TRAVELLER',
      startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      applicableResortId: null
    },
    {
      id: "hmp-fest",
      code: 'HAMPIFEST',
      description: 'Seasonal celebration: 15% off up to ₹3,000.',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minimumAmount: 10000,
      maxDiscount: 3000,
      usedCount: 0,
      startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      applicableResortId: null,
      applicableRole: null
    }
  ];
}

function readJsonFile(filePath) {
  try {
    if (filePath && fs.readFileSync) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    // Fallback if read fails
  }
  if (filePath && filePath === COUPONS_FILE) {
    if (!couponsMemoryCache) couponsMemoryCache = getInitialSeededCoupons();
    return couponsMemoryCache;
  } else if (filePath && filePath === BOOKING_COUPONS_FILE) {
    if (!bookingCouponsMemoryCache) bookingCouponsMemoryCache = [];
    return bookingCouponsMemoryCache;
  } else {
    // String heuristic if paths are uninitialized in worker
    if (filePath && typeof filePath === 'string' && filePath.includes('booking_coupons')) {
      if (!bookingCouponsMemoryCache) bookingCouponsMemoryCache = [];
      return bookingCouponsMemoryCache;
    }
    if (!couponsMemoryCache) couponsMemoryCache = getInitialSeededCoupons();
    return couponsMemoryCache;
  }
}

function writeJsonFile(filePath, data) {
  try {
    if (filePath && fs.writeFileSync) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      return;
    }
  } catch (err) {
    // Fallback if write fails
  }
  if (filePath && filePath === COUPONS_FILE) {
    couponsMemoryCache = data;
  } else if (filePath && filePath === BOOKING_COUPONS_FILE) {
    bookingCouponsMemoryCache = data;
  } else {
    if (filePath && typeof filePath === 'string' && filePath.includes('booking_coupons')) {
      bookingCouponsMemoryCache = data;
    } else {
      couponsMemoryCache = data;
    }
  }
}

// Check if database supports coupons
let dbSupportsCoupons = null;

async function checkDbSupport(prisma) {
  if (dbSupportsCoupons !== null) return dbSupportsCoupons;
  try {
    await prisma.coupon.findFirst();
    dbSupportsCoupons = true;
  } catch (err) {
    console.warn("DB does not support Coupon table. Falling back to local JSON / memory store.");
    dbSupportsCoupons = false;
  }
  return dbSupportsCoupons;
}

export async function findCouponByCode(prisma, code) {
  const isSupported = await checkDbSupport(prisma);
  const cleanCode = code.trim().toUpperCase();
  if (isSupported) {
    try {
      return await prisma.coupon.findUnique({ where: { code: cleanCode } });
    } catch (e) {
      // Fallback on unexpected DB error
    }
  }
  const coupons = readJsonFile(COUPONS_FILE);
  if (coupons.length === 0) {
    const seeded = getInitialSeededCoupons();
    writeJsonFile(COUPONS_FILE, seeded);
    return seeded.find(c => c.code === cleanCode) || null;
  }
  return coupons.find(c => c.code === cleanCode) || null;
}

export async function getAllCoupons(prisma) {
  const isSupported = await checkDbSupport(prisma);
  if (isSupported) {
    try {
      return await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    } catch (e) {}
  }
  const coupons = readJsonFile(COUPONS_FILE);
  if (coupons.length === 0) {
    const seeded = getInitialSeededCoupons();
    writeJsonFile(COUPONS_FILE, seeded);
    return seeded;
  }
  return coupons;
}

export async function createCouponInDb(prisma, data) {
  const isSupported = await checkDbSupport(prisma);
  if (isSupported) {
    try {
      return await prisma.coupon.create({ data });
    } catch (e) {}
  }
  const coupons = readJsonFile(COUPONS_FILE);
  const newCoupon = {
    id: `cpn-${Math.random().toString(36).substring(2, 11)}`,
    ...data,
    usedCount: 0,
    startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : new Date().toISOString(),
    expiresAt: new Date(data.expiresAt).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  coupons.push(newCoupon);
  writeJsonFile(COUPONS_FILE, coupons);
  return newCoupon;
}

export async function updateCouponStatus(prisma, id, active) {
  const isSupported = await checkDbSupport(prisma);
  if (isSupported) {
    try {
      return await prisma.coupon.update({
        where: { id },
        data: { active }
      });
    } catch (e) {}
  }
  const coupons = readJsonFile(COUPONS_FILE);
  const index = coupons.findIndex(c => c.id === id);
  if (index !== -1) {
    coupons[index].active = active;
    coupons[index].updatedAt = new Date().toISOString();
    writeJsonFile(COUPONS_FILE, coupons);
    return coupons[index];
  }
  throw new Error("Coupon not found");
}

export async function deleteCouponFromDb(prisma, id) {
  const isSupported = await checkDbSupport(prisma);
  if (isSupported) {
    try {
      return await prisma.coupon.delete({ where: { id } });
    } catch (e) {}
  }
  const coupons = readJsonFile(COUPONS_FILE);
  const filtered = coupons.filter(c => c.id !== id);
  writeJsonFile(COUPONS_FILE, filtered);
  return { success: true };
}

export async function incrementCouponUsage(prisma, code) {
  const cleanCode = code.trim().toUpperCase();
  try {
    return await prisma.promotion.update({
      where: { code: cleanCode },
      data: { usageCount: { increment: 1 } }
    });
  } catch (e) {
    console.error("Failed to increment promotion usage", e);
  }
}

export async function getUserCouponUsageCount(prisma, userId, code) {
  const cleanCode = code.trim().toUpperCase();
  try {
    // Attempt database check
    const isSupported = await checkDbSupport(prisma);
    if (isSupported) {
      return await prisma.booking.count({
        where: {
          userId,
          couponCode: cleanCode,
          status: { in: ['PAID', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED'] }
        }
      });
    }
  } catch (e) {
    // Fallback if column not present in DB
  }
  const usages = readJsonFile(BOOKING_COUPONS_FILE);
  return usages.filter(u => u.userId === userId && u.couponCode === cleanCode).length;
}

export async function getUserBookingsCount(prisma, userId) {
  try {
    return await prisma.booking.count({
      where: {
        userId,
        status: { in: ['PAID', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED'] }
      }
    });
  } catch (e) {
    // Fallback
  }
  return 0;
}

export async function recordBookingCoupon(prisma, bookingId, userId, couponCode, discountAmount) {
  const usages = readJsonFile(BOOKING_COUPONS_FILE);
  usages.push({
    bookingId,
    userId,
    couponCode: couponCode.trim().toUpperCase(),
    discountAmount,
    timestamp: new Date().toISOString()
  });
  writeJsonFile(BOOKING_COUPONS_FILE, usages);
}

export async function getBookingCouponsAnalytics(prisma) {
  try {
    const isSupported = await checkDbSupport(prisma);
    if (isSupported) {
      return await prisma.booking.findMany({
        where: {
          couponCode: { not: null },
          status: { in: ['PAID', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED'] }
        },
        select: {
          couponCode: true,
          discountAmount: true,
          totalPrice: true
        }
      });
    }
  } catch (e) {}

  const usages = readJsonFile(BOOKING_COUPONS_FILE);
  return usages.map(u => ({
    couponCode: u.couponCode,
    discountAmount: u.discountAmount,
    totalPrice: 0
  }));
}
