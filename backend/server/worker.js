import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { encrypt, decrypt, setEncryptionKey } from './utils/crypto.js';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import crypto from 'crypto';
import { Resend } from 'resend';

const app = new Hono({ strict: false }).basePath('/api');

// --- Initialization ---
let prismaInstance;
const getPrisma = (env) => {
  if (env.ENCRYPTION_KEY) {
    setEncryptionKey(env.ENCRYPTION_KEY);
  }
  if (prismaInstance) return prismaInstance;
  
  // safeEncrypt: prevents double-encryption if the value is already in iv:authTag:cipher format
  const safeEncrypt = (value) => {
    if (!value) return value;
    const parts = value.split(':');
    if (parts.length === 3 && /^[0-9a-f]{24}$/i.test(parts[0]) && /^[0-9a-f]{32}$/i.test(parts[1])) {
      return value; // already encrypted
    }
    return encrypt(value);
  };

  prismaInstance = new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
  }).$extends(withAccelerate()).$extends({
    query: {
      user: {
        async create({ args, query }) {
          if (args.data.phone) args.data.phone = safeEncrypt(args.data.phone);
          if (args.data.location) args.data.location = safeEncrypt(args.data.location);
          if (args.data.idNumber) args.data.idNumber = safeEncrypt(args.data.idNumber);
          return query(args);
        },
        async update({ args, query }) {
          if (args.data.phone) args.data.phone = safeEncrypt(args.data.phone);
          if (args.data.location) args.data.location = safeEncrypt(args.data.location);
          if (args.data.idNumber) args.data.idNumber = safeEncrypt(args.data.idNumber);
          return query(args);
        },
      },
      resortOwner: {
        async create({ args, query }) {
          if (args.data.gstNumber) args.data.gstNumber = safeEncrypt(args.data.gstNumber);
          return query(args);
        },
        async update({ args, query }) {
          if (args.data.gstNumber) args.data.gstNumber = safeEncrypt(args.data.gstNumber);
          return query(args);
        },
      },
      guideProfile: {
        async create({ args, query }) {
          if (args.data.idNumber) args.data.idNumber = safeEncrypt(args.data.idNumber);
          return query(args);
        },
        async update({ args, query }) {
          if (args.data.idNumber) args.data.idNumber = safeEncrypt(args.data.idNumber);
          return query(args);
        },
      },
    },
    // NOTE: result.compute is NOT used here because it is silently bypassed in the
    // Cloudflare Workers Edge runtime. Decryption is handled explicitly via decryptUser().
  });
  
  return prismaInstance;
};

/**
 * Explicitly decrypt PII fields on a raw user object returned from Prisma.
 * This is required because Prisma $extends result.compute is silently bypassed
 * in the Cloudflare Workers Edge runtime.
 */
const decryptUser = (user) => {
  if (!user) return user;
  const out = { ...user };
  if (out.phone) out.phone = decrypt(out.phone);
  if (out.location) out.location = decrypt(out.location);
  if (out.idNumber) out.idNumber = decrypt(out.idNumber);
  delete out.passwordHash;
  return out;
};

const decryptOwner = (owner) => {
  if (!owner) return owner;
  const out = { ...owner };
  if (out.gstNumber) out.gstNumber = decrypt(out.gstNumber);
  return out;
};

const decryptGuide = (guide) => {
  if (!guide) return guide;
  const out = { ...guide };
  if (out.idNumber) out.idNumber = decrypt(out.idNumber);
  return out;
};

// --- Edge Rate Limiting & Abuse Protection ---
const rateLimitCache = new Map();

const getClientIp = (c) => c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';

const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000;
  const maxRequests = options.maxRequests || 100;
  
  return async (c, next) => {
    const ip = getClientIp(c);
    const key = `${ip}:${options.name || 'global'}`;
    const now = Date.now();
    let record = rateLimitCache.get(key);
    
    if (!record) {
      record = { count: 1, resetTime: now + windowMs };
      rateLimitCache.set(key, record);
    } else {
      if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
      } else {
        record.count++;
      }
    }

    if (record.count > maxRequests) {
      console.warn(`[ABUSE DETECTED] Rate limit exceeded for IP: ${ip} on limiter: ${options.name}`);
      return c.json({ 
        error: options.message || "Too many requests detected. Please wait a moment before trying again." 
      }, 429);
    }

    // Clean up stale cache randomly (5% chance per request) to prevent isolate memory leaks
    if (Math.random() < 0.05) {
      for (const [k, v] of rateLimitCache.entries()) {
        if (now > v.resetTime) rateLimitCache.delete(k);
      }
    }

    await next();
  };
};

const authLimiter = createRateLimiter({ name: 'auth', windowMs: 15 * 60 * 1000, maxRequests: 5, message: "Too many login attempts. Please wait 15 minutes." });
const otpLimiter = createRateLimiter({ name: 'otp', windowMs: 10 * 60 * 1000, maxRequests: 3, message: "Too many OTP requests. Please wait 10 minutes." });
const bookingLimiter = createRateLimiter({ name: 'booking', windowMs: 10 * 60 * 1000, maxRequests: 10, message: "Too many booking attempts. Please slow down." });
const uploadLimiter = createRateLimiter({ name: 'upload', windowMs: 60 * 60 * 1000, maxRequests: 30, message: "Upload limit reached. Try again later." });
const globalLimiter = createRateLimiter({ name: 'global', windowMs: 1 * 60 * 1000, maxRequests: 300, message: "Too many requests detected. Please wait a moment before trying again." });

// --- Middleware ---
app.use('*', logger());

// CORS MUST be first — before rate limiters — so OPTIONS preflight always gets CORS headers
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.FRONTEND_URL || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Rate limiters — skip OPTIONS preflight requests so they never count against limits
app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return next();
  return globalLimiter(c, next);
});
app.use('/auth/login', async (c, next) => { if (c.req.method === 'OPTIONS') return next(); return authLimiter(c, next); });
app.use('/auth/register', async (c, next) => { if (c.req.method === 'OPTIONS') return next(); return authLimiter(c, next); });
app.use('/auth/send-otp', async (c, next) => { if (c.req.method === 'OPTIONS') return next(); return otpLimiter(c, next); });
app.use('/auth/verify-otp', async (c, next) => { if (c.req.method === 'OPTIONS') return next(); return otpLimiter(c, next); });
app.use('/auth/forgot-password', async (c, next) => { if (c.req.method === 'OPTIONS') return next(); return otpLimiter(c, next); });
app.use('/bookings', async (c, next) => { if (c.req.method === 'OPTIONS') return next(); return bookingLimiter(c, next); });
app.use('/upload/signature', async (c, next) => { if (c.req.method === 'OPTIONS') return next(); return uploadLimiter(c, next); });

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

app.get('/health', (c) => {
  const key = c.env.ENCRYPTION_KEY;
  const keyHash = key ? crypto.createHash('sha256').update(key).digest('hex') : 'null';
  return c.json({ 
    status: 'ok', 
    timestamp: new Date(), 
    encryptionKeyLength: key ? key.length : 0,
    encryptionKeyPrefix: key ? key.substring(0, 6) : 'null',
    encryptionKeyHash: keyHash
  });
});


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
    if (!user) {
      return c.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, 404);
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return c.json({ error: 'Incorrect password. Please try again.', code: 'INCORRECT_PASSWORD' }, 401);
    }
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

app.post('/auth/forgot-password', async (c) => {
  const prisma = getPrisma(c.env);
  const { email } = await c.req.json();
  const normalizedEmail = email.toLowerCase();
  try {
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return c.json({
        success: true,
        message: 'If that email address is in our system, we have sent a password reset link to it.'
      });
    }

    await prisma.otpVerification.deleteMany({
      where: { email: normalizedEmail, otpType: 'password_reset' }
    });

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 12);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.otpVerification.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
        otpHash: tokenHash,
        otpType: 'password_reset',
        expiresAt
      }
    });

    const frontendUrl = c.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    console.log(`[PASSWORD_RESET_DEV_LINK] -> ${resetLink}`);

    if (c.env.RESEND_API_KEY) {
      const resend = new Resend(c.env.RESEND_API_KEY);
      const emailFrom = c.env.EMAIL_FROM || 'noreply@hampistays.com';
      c.executionCtx.waitUntil(
        resend.emails.send({
          from: emailFrom,
          to: normalizedEmail,
          subject: 'Reset your HampiStays Password',
          html: `
            <div style="font-family: 'Outfit', sans-serif; background-color: #F5F1E9; padding: 40px; color: #0A1128;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; padding: 40px; border: 1px solid rgba(197, 160, 89, 0.3); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h2 style="font-family: serif; color: #0A1128; font-size: 28px; margin: 0;">HampiStays</h2>
                  <p style="color: #C5A059; font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; font-weight: bold; margin-top: 5px;">Luxury Sanctuary stays</p>
                </div>
                <h3 style="font-size: 20px; font-weight: bold; margin-bottom: 20px;">Password Reset Request</h3>
                <p style="font-size: 14px; line-height: 1.6; color: rgba(10, 17, 40, 0.7); margin-bottom: 30px;">
                  We received a request to reset the password for your HampiStays account. Click the premium link below to set up a new password. This link is valid for 15 minutes.
                </p>
                <div style="text-align: center; margin-bottom: 30px;">
                  <a href="${resetLink}" style="background-color: #C5A059; color: #0A1128; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px rgba(197, 160, 89, 0.2);">
                    Reset Password
                  </a>
                </div>
                <p style="font-size: 12px; color: rgba(10, 17, 40, 0.4); text-align: center;">
                  If you didn't request this, you can safely ignore this email.
                </p>
              </div>
            </div>
          `
        }).catch(err => console.error('Failed to send async reset email:', err))
      );
    }

    return c.json({
      success: true,
      message: 'If that email address is in our system, we have sent a password reset link to it.',
      devResetLink: c.env.NODE_ENV !== 'production' ? resetLink : undefined
    });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.post('/auth/reset-password', async (c) => {
  const prisma = getPrisma(c.env);
  const { token, email, password } = await c.req.json();
  const normalizedEmail = email.toLowerCase();
  try {
    const records = await prisma.otpVerification.findMany({
      where: {
        email: normalizedEmail,
        otpType: 'password_reset',
        verified: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (records.length === 0) {
      return c.json({ error: 'The password reset link is invalid or has expired. Please request a new link.' }, 400);
    }

    let matchingRecord = null;
    for (const record of records) {
      if (record.attempts >= 5) continue;
      const isMatch = await bcrypt.compare(token, record.otpHash);
      if (isMatch) {
        matchingRecord = record;
        break;
      } else {
        await prisma.otpVerification.update({
          where: { id: record.id },
          data: { attempts: { increment: 1 } }
        });
      }
    }

    if (!matchingRecord) {
      return c.json({ error: 'The password reset link is invalid or has expired. Please request a new link.' }, 400);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    await prisma.$transaction([
      prisma.user.update({
        where: { email: normalizedEmail },
        data: { passwordHash }
      }),
      prisma.otpVerification.update({
        where: { id: matchingRecord.id },
        data: { verified: true }
      })
    ]);

    return c.json({
      success: true,
      message: 'Your password has been successfully reset. You can now log in with your new password.'
    });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.post('/auth/google', async (c) => {
  const prisma = getPrisma(c.env);
  const { credential, role } = await c.req.json();
  try {
    const googleClientId = c.env.VITE_GOOGLE_CLIENT_ID || c.env.GOOGLE_CLIENT_ID || '';
    const oAuthClient = new OAuth2Client(googleClientId);
    const ticket = await oAuthClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload) return c.json({ error: 'Invalid token' }, 400);

    const userEmail = payload.email?.toLowerCase();
    if (!userEmail) return c.json({ error: 'Email not found in Google response' }, 400);

    let user = await prisma.user.findUnique({ where: { email: userEmail } });

    if (!user) {
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: userEmail,
            name: payload.name || 'Google Traveler',
            passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
            role: role || 'TRAVELLER',
            avatar: payload.picture
          }
        });

        if (role === 'RESORT_OWNER') {
          await tx.resortOwner.create({
            data: {
              userId: newUser.id,
              businessName: `${newUser.name}'s Portfolio`,
            },
          });
        }

        if (role === 'GUIDE') {
          await tx.guideProfile.create({
            data: {
              userId: newUser.id,
              bio: "Certified Hampi Expert dedicated to sharing the majestic history of the Vijayanagara Empire.",
              specialties: ["Architecture", "History"],
              languages: ["English", "Kannada"],
              pricePerDay: 2500,
              pricePerHour: 500,
              yearsExperience: 0,
            },
          });
        }

        return newUser;
      });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, c.env.JWT_SECRET, { expiresIn: '7d' });

    return c.json({
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        avatar: user.avatar,
        phone: user.phone,
        location: user.location,
        kycStatus: user.kycStatus || 'NOT_SUBMITTED'
      }
    });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.post('/auth/apple', async (c) => {
  const prisma = getPrisma(c.env);
  const { id_token, user: userDetails, role } = await c.req.json();
  try {
    const appleClientId = c.env.APPLE_CLIENT_ID || '';
    const { sub: appleId, email } = await appleSignin.verifyIdToken(id_token, {
      audience: appleClientId,
    });

    const userEmail = email.toLowerCase();
    let user = await prisma.user.findUnique({ where: { email: userEmail } });

    if (!user) {
      const name = userDetails ? `${userDetails.name.firstName} ${userDetails.name.lastName}` : 'Apple Traveler';
      
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: userEmail,
            name: name,
            passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
            role: role || 'TRAVELLER'
          }
        });

        if (role === 'RESORT_OWNER') {
          await tx.resortOwner.create({
            data: {
              userId: newUser.id,
              businessName: `${newUser.name}'s Portfolio`,
            },
          });
        }

        if (role === 'GUIDE') {
          await tx.guideProfile.create({
            data: {
              userId: newUser.id,
              bio: "Certified Hampi Expert dedicated to sharing the majestic history of the Vijayanagara Empire.",
              specialties: ["Architecture", "History"],
              languages: ["English", "Kannada"],
              pricePerDay: 2500,
              pricePerHour: 500,
              yearsExperience: 0,
            },
          });
        }

        return newUser;
      });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, c.env.JWT_SECRET, { expiresIn: '7d' });

    return c.json({
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        location: user.location,
        kycStatus: user.kycStatus || 'NOT_SUBMITTED'
      }
    });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.post('/auth/send-otp', async (c) => {
  const prisma = getPrisma(c.env);
  const { email, userId } = await c.req.json();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'A valid email address is required.' }, 400);
  }
  try {
    await prisma.otpVerification.deleteMany({
      where: { email, otpType: 'email', verified: false }
    });

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otpVerification.create({
      data: { userId: userId || null, email, otpHash, otpType: 'email', expiresAt }
    });

    if (c.env.RESEND_API_KEY) {
      const resend = new Resend(c.env.RESEND_API_KEY);
      const emailFrom = c.env.EMAIL_FROM || 'noreply@hampistays.com';
      c.executionCtx.waitUntil(
        resend.emails.send({
          from: emailFrom,
          to: email,
          subject: `${otp} – Your HampiStays Verification Code`,
          html: `<h1>Your verification code is ${otp}</h1>`
        }).catch(err => console.error("Async email send failed:", err))
      );
    }

    return c.json({ 
      success: true, 
      message: `Verification code sent to ${email}`,
      devOtp: c.env.NODE_ENV !== 'production' ? otp : undefined 
    });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.post('/auth/send-email-otp', async (c) => {
  const prisma = getPrisma(c.env);
  const { email, userId } = await c.req.json();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'A valid email address is required.' }, 400);
  }
  try {
    await prisma.otpVerification.deleteMany({
      where: { email, otpType: 'email', verified: false }
    });

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otpVerification.create({
      data: { userId: userId || null, email, otpHash, otpType: 'email', expiresAt }
    });

    if (c.env.RESEND_API_KEY) {
      const resend = new Resend(c.env.RESEND_API_KEY);
      const emailFrom = c.env.EMAIL_FROM || 'noreply@hampistays.com';
      c.executionCtx.waitUntil(
        resend.emails.send({
          from: emailFrom,
          to: email,
          subject: `${otp} – Your HampiStays Verification Code`,
          html: `<h1>Your verification code is ${otp}</h1>`
        }).catch(err => console.error("Async email send failed:", err))
      );
    }

    return c.json({ 
      success: true, 
      message: `Verification code sent to ${email}`,
      devOtp: c.env.NODE_ENV !== 'production' ? otp : undefined 
    });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.post('/auth/send-mobile-otp', async (c) => {
  const prisma = getPrisma(c.env);
  const { phone, userId } = await c.req.json();
  if (!phone || !/^[6-9]\d{9}$/.test(phone.replace(/\D/g, '').slice(-10))) {
    return c.json({ error: 'A valid 10-digit Indian mobile number is required.' }, 400);
  }
  const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
  try {
    await prisma.otpVerification.deleteMany({
      where: { phone: normalizedPhone, otpType: 'mobile', verified: false }
    });

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otpVerification.create({
      data: { userId: userId || null, phone: normalizedPhone, otpHash, otpType: 'mobile', expiresAt }
    });

    if (c.env.TWILIO_ACCOUNT_SID && c.env.TWILIO_AUTH_TOKEN) {
      c.executionCtx.waitUntil(
        (async () => {
          try {
            const twilio = await import('twilio');
            const twilioClient = twilio.default(c.env.TWILIO_ACCOUNT_SID, c.env.TWILIO_AUTH_TOKEN);
            await twilioClient.messages.create({
              body: `Your HampiStays verification code is: ${otp}. Valid for 5 minutes.`,
              from: c.env.TWILIO_PHONE_NUMBER,
              to: `+91${normalizedPhone}`
            });
          } catch (err) {
            console.error("Twilio async send failed:", err);
          }
        })()
      );
    }

    return c.json({ 
      success: true, 
      message: `Verification code sent to +91${normalizedPhone}`,
      devOtp: c.env.NODE_ENV !== 'production' ? otp : undefined 
    });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.post('/auth/verify-otp', async (c) => {
  const prisma = getPrisma(c.env);
  const { otp, email, phone, otpType, userId } = await c.req.json();
  try {
    const whereClause = otpType === 'email' || email
      ? { email, otpType: 'email', verified: false }
      : { phone: phone?.replace(/\D/g, '').slice(-10), otpType: 'mobile', verified: false };

    const record = await prisma.otpVerification.findFirst({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    if (!record || new Date() > record.expiresAt || record.attempts >= 5) {
      return c.json({ error: 'Invalid or expired OTP. Please request a new code.' }, 400);
    }

    const isValid = await bcrypt.compare(otp, record.otpHash);
    if (!isValid) {
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } }
      });
      return c.json({ error: 'Invalid code.' }, 400);
    }

    await prisma.otpVerification.update({ where: { id: record.id }, data: { verified: true } });

    const targetUserId = userId || record.userId;
    let user;
    if (targetUserId) {
      const updateData = otpType === 'mobile' || phone ? { isMobileVerified: true } : { isEmailVerified: true };
      await prisma.user.update({ where: { id: targetUserId }, data: updateData });
      user = await prisma.user.findUnique({ where: { id: targetUserId } });
    } else if (otpType === 'mobile' && phone) {
      const normalizedPhone = phone?.replace(/\\D/g, '').slice(-10);
      user = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { isMobileVerified: true } });
      }
    } else if (email) {
      const emailLower = email?.toLowerCase();
      user = await prisma.user.findUnique({ where: { email: emailLower } });
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { isEmailVerified: true } });
      }
    }

    if (user) {
      const token = jwt.sign({ userId: user.id, role: user.role }, c.env.JWT_SECRET, { expiresIn: '7d' });
      return c.json({
        success: true,
        verified: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
          location: user.location
        }
      });
    }

    return c.json({ success: true, verified: true });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// --- User Profile & Dashboard ---
app.get('/users/profile', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const payload = c.get('user');
  try {
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return c.json({ error: 'User not found' }, 404);
    return c.json(decryptUser(user));
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.patch('/users/profile', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const payload = c.get('user');
  const body = await c.req.json();
  try {
    // Only update fields that are explicitly provided in the request body
    const data = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.email !== undefined) data.email = body.email.toLowerCase();
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.avatar !== undefined) data.avatar = body.avatar;
    if (body.location !== undefined) data.location = body.location;
    if (body.idType !== undefined) data.idType = body.idType;
    if (body.idNumber !== undefined) data.idNumber = body.idNumber;
    if (body.idImage !== undefined) {
      data.idImage = body.idImage;
      // Only set kycStatus to PENDING if a new document is being uploaded
      const currentUser = await prisma.user.findUnique({ where: { id: payload.userId }, select: { idImage: true, kycStatus: true } });
      if (body.idImage && body.idImage !== currentUser?.idImage && currentUser?.kycStatus !== 'VERIFIED') {
        data.kycStatus = 'PENDING';
      }
    }

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data
    });
    return c.json(decryptUser(user));
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/users/bookings', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const payload = c.get('user');
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: payload.userId },
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
    return c.json(bookings);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/users/notifications', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const payload = c.get('user');
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' }
    });
    return c.json(notifications);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/users/:id', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return c.json({ error: 'User not found' }, 404);
    return c.json(decryptUser(user));
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.patch('/users/:id', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  const payload = c.get('user');
  if (payload.userId !== id && payload.role !== 'ADMIN') {
    return c.json({ error: 'Unauthorized to update this profile' }, 403);
  }
  const body = await c.req.json();
  try {
    // Only update fields that are explicitly provided in the request body
    const data = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.email !== undefined) data.email = body.email.toLowerCase();
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.avatar !== undefined) data.avatar = body.avatar;
    if (body.location !== undefined) data.location = body.location;
    if (body.idType !== undefined) data.idType = body.idType;
    if (body.idNumber !== undefined) data.idNumber = body.idNumber;
    if (body.idImage !== undefined) {
      data.idImage = body.idImage;
      const currentUser = await prisma.user.findUnique({ where: { id }, select: { idImage: true, kycStatus: true } });
      if (body.idImage && body.idImage !== currentUser?.idImage && currentUser?.kycStatus !== 'VERIFIED') {
        data.kycStatus = 'PENDING';
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data
    });
    return c.json(decryptUser(user));
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// --- Wishlist ---
app.post('/wishlist/toggle', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const payload = c.get('user');
  const { userId, resortId } = await c.req.json();
  if (!userId || !resortId) return c.json({ error: 'User ID and Resort ID are required' }, 400);
  if (payload.userId !== userId) return c.json({ error: 'Unauthorized' }, 403);
  try {
    const existing = await prisma.wishlist.findUnique({
      where: { userId_resortId: { userId, resortId } }
    });
    
    if (existing) {
      await prisma.wishlist.delete({ where: { id: existing.id } });
      return c.json({ saved: false, message: 'Removed from wishlist' });
    } else {
      await prisma.wishlist.create({ data: { userId, resortId } });
      return c.json({ saved: true, message: 'Added to wishlist' });
    }
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/users/:id/wishlist', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: id },
      include: { resort: true },
      orderBy: { createdAt: 'desc' }
    });
    const resorts = wishlist.map(item => item.resort);
    return c.json(resorts);
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
        categories: true,
        amenities: true
      },
      cacheStrategy: { swr: 300, ttl: 300 } // Edge cache for 5 mins
    });

    const optimizedResorts = resorts.map(r => ({
      ...r,
      category: r.categories[0] || null,
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
    let categoriesQuery = [];
    if (category) {
      if (Array.isArray(category)) {
        categoriesQuery = category;
      } else if (typeof category === 'string') {
        if (category.startsWith('[') && category.endsWith(']')) {
          try {
            categoriesQuery = JSON.parse(category);
          } catch (e) {
            categoriesQuery = category.split(',').map(x => x.trim()).filter(Boolean);
          }
        } else {
          categoriesQuery = category.split(',').map(x => x.trim()).filter(Boolean);
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
        categories: true,
        isVerified: true,
        isFeatured: true,
      },
      cacheStrategy: { swr: 60, ttl: 60 }, // Cache at the edge for 60s
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

    const optimizedResorts = filteredResorts.map(r => ({
      ...r,
      category: r.categories[0] || null,
      images: r.images.slice(0, 1)
    }));

    return c.json(optimizedResorts);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/resorts/categories', async (c) => {
  const prisma = getPrisma(c.env);
  try {
    const resorts = await prisma.resort.findMany({
      where: { status: 'APPROVED' },
      select: { categories: true }
    });
    const categories = Array.from(new Set(resorts.flatMap(r => r.categories || [])));
    return c.json(categories);
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

app.get('/reviews/resort/:resortId', async (c) => {
  const prisma = getPrisma(c.env);
  const resortId = c.req.param('resortId');
  try {
    const reviews = await prisma.review.findMany({
      where: { resortId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return c.json(reviews);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.post('/reviews', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const payload = c.get('user');
  const userId = payload.userId;
  try {
    const data = await c.req.json();
    const { resortId, rating, comment } = data;
    
    if (!resortId || !rating || !comment) {
      return c.json({ error: 'Resort ID, rating, and comment are required' }, 400);
    }
    
    const ratingVal = parseInt(rating);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return c.json({ error: 'Rating must be between 1 and 5' }, 400);
    }
    
    const resort = await prisma.resort.findUnique({ where: { id: resortId } });
    if (!resort) return c.json({ error: 'Resort not found' }, 404);
    
    const review = await prisma.review.create({
      data: {
        resortId,
        userId,
        rating: ratingVal,
        comment: comment.trim()
      },
      include: { user: { select: { name: true, email: true } } }
    });
    
    const aggregates = await prisma.review.aggregate({
      where: { resortId },
      _avg: { rating: true },
      _count: { id: true }
    });
    
    const averageRating = parseFloat((aggregates._avg.rating || ratingVal).toFixed(1));
    const totalReviews = aggregates._count.id || 1;
    
    await prisma.resort.update({
      where: { id: resortId },
      data: { rating: averageRating, reviewCount: totalReviews }
    });
    
    return c.json(review, 201);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.post('/resorts', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const data = await c.req.json();
  const payload = c.get('user');
  
  try {
    const { name, tagline, description, type, area, price, amenities, category, categories, roomTypes, images, mealPackages, houseRules, documents } = data;
    const ownerId = payload.userId;
    
    const owner = await prisma.resortOwner.findUnique({ where: { userId: ownerId } });
    if (!owner) return c.json({ error: 'Resort owner profile not found. Please complete owner registration.' }, 403);

    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.random().toString(36).substring(2, 7);
    
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
        name,
        slug,
        tagline,
        description,
        type: type || 'luxury',
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
        roomTypes: {
          include: {
            priceOverrides: true,
            blockings: true
          }
        }, 
        bookings: { 
          include: { user: true, room: true },
          orderBy: { createdAt: 'desc' }
        },
        discountCodes: true
      }
    });
    return c.json(resorts);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/owners/:id/stats', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const userId = c.req.param('id');
  try {
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

    if (!owner) return c.json({ revenue: 0, bookings: 0, rating: 0 });

    const resorts = owner.resorts;
    const totalRevenue = resorts.reduce((sum, r) => 
      sum + r.bookings.reduce((bSum, b) => bSum + (b.status !== 'CANCELLED' ? b.totalPrice : 0), 0)
    , 0);
    const totalBookings = resorts.reduce((sum, r) => sum + r.bookings.length, 0);
    const avgRating = resorts.reduce((sum, r) => sum + (r.rating || 5), 0) / (resorts.length || 1);

    return c.json({
      revenue: totalRevenue,
      bookings: totalBookings,
      rating: Number(avgRating.toFixed(1))
    });
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
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        description: true,
        type: true,
        locationArea: true,
        locationLat: true,
        locationLng: true,
        images: true,
        amenities: true,
        rating: true,
        reviewCount: true,
        pricePerNight: true,
        isFeatured: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        categories: true,
        houseRules: true,
        mealPackages: true,
        status: true,
        commissionRate: true,
        owner: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                phone: true,
                createdAt: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const mappedResorts = resorts.map(r => ({
      ...r,
      category: r.categories[0] || null
    }));

    return c.json(mappedResorts);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/admin/resorts/active', authMiddleware, adminMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  try {
    const resorts = await prisma.resort.findMany({
      where: { status: 'APPROVED' },
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        description: true,
        type: true,
        locationArea: true,
        locationLat: true,
        locationLng: true,
        images: true,
        amenities: true,
        rating: true,
        reviewCount: true,
        pricePerNight: true,
        isFeatured: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        categories: true,
        houseRules: true,
        mealPackages: true,
        status: true,
        commissionRate: true,
        owner: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                phone: true,
                createdAt: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const mappedResorts = resorts.map(r => ({
      ...r,
      category: r.categories[0] || null
    }));

    return c.json(mappedResorts);
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
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        guests: true,
        totalPrice: true,
        status: true,
        specialRequests: true,
        referenceNumber: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        resortId: true,
        roomId: true,
        commissionRate: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        resort: {
          select: {
            id: true,
            name: true
          }
        },
        room: {
          select: {
            id: true,
            name: true
          }
        }
      },
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
    const guide = await prisma.guideProfile.update({ 
      where: { id }, 
      data: { status },
      include: { user: true }
    });
    if (guide.userId) {
      await prisma.user.update({
        where: { id: guide.userId },
        data: { kycStatus: status }
      });
    }
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
    // We run the concurrency check and booking creation in a transaction
    const { booking, totalPrice, referenceNumber } = await prisma.$transaction(async (tx) => {
      // 1. RECALCULATE PRICE & FETCH ROOM DETAILS
      const resort = await tx.resort.findUnique({ 
        where: { id: resortId },
        include: { roomTypes: true }
      });
      
      if (!resort) throw new Error('Resort not found');
      
      const room = resort.roomTypes.find(r => r.id === roomId);
      if (!room) throw new Error('Room type not found');

      // Parse dates safely
      const parseDate = (d) => {
        const s = typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0];
        const [y, m, day] = s.split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, day));
      };
      const startDate = parseDate(checkIn);
      const endDate = parseDate(checkOut);
      
      // 2. CONCURRENCY CHECK: OVERLAP VALIDATION
      // Find all bookings for this room that overlap with the requested dates
      // and are either CONFIRMED/PAID/CHECKED_IN, OR are PENDING and created within the last 15 minutes
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      const overlappingBookings = await tx.booking.count({
        where: {
          roomId: roomId,
          checkIn: { lt: endDate },
          checkOut: { gt: startDate },
          OR: [
            { status: { in: ['PAID', 'CONFIRMED', 'CHECKED_IN'] } },
            { status: 'PENDING', createdAt: { gt: fifteenMinsAgo } }
          ]
        }
      });

      // If all available units for this room type are taken, abort!
      if (overlappingBookings >= room.availableCount) {
        throw new Error('ROOM_UNAVAILABLE');
      }

      // 3. PRICE CALCULATION
      const nights = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const nightsTotal = room.pricePerNight * nights;
      const taxes = Math.round(nightsTotal * 0.12);
      const insuranceCost = addInsurance ? Math.round(nightsTotal * 0.02) : 0;
      const airportPickupCost = airportPickup ? 1500 : 0;
      const computedTotal = nightsTotal + taxes + insuranceCost + airportPickupCost;

      const refNum = `HST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // 4. CREATE PENDING RESERVATION (LOCK)
      const newBooking = await tx.booking.create({
        data: {
          userId: payload.userId,
          resortId,
          roomId,
          checkIn: startDate,
          checkOut: endDate,
          guests: parseInt(guests) || 1,
          totalPrice: computedTotal,
          specialRequests,
          referenceNumber: refNum,
          commissionRate: resort.commissionRate || 7.0,
          status: 'PENDING'
        }
      });

      return { booking: newBooking, totalPrice: computedTotal, referenceNumber: refNum };
    }, {
      isolationLevel: 'Serializable', // Use strictest isolation for concurrency safety
      maxWait: 5000,
      timeout: 10000
    });

    // 5. CREATE RAZORPAY ORDER (OUTSIDE TRANSACTION TO AVOID HOLDING LOCKS)
    try {
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

      return c.json({ ...booking, orderId: order.id });
    } catch (rzpErr) {
      // If Razorpay fails, immediately release the held room reservation
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'FAILED' }
      });
      throw rzpErr;
    }

  } catch (err) { 
    if (err.message === 'ROOM_UNAVAILABLE') {
      return c.json({ error: 'This sanctuary was just reserved by another traveler. Please select different dates or another room.' }, 409);
    }
    return c.json({ error: err.message }, 500); 
  }
});

// Get booking by reference number (used by CheckoutSuccessPage)
app.get('/bookings/reference/:ref', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const ref = c.req.param('ref');
  try {
    const booking = await prisma.booking.findUnique({
      where: { referenceNumber: ref },
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
      }
    });
    if (!booking) return c.json({ error: 'Booking not found' }, 404);
    return c.json(booking);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.post('/bookings/:ref/verify-payment', authMiddleware, async (c) => {

  const prisma = getPrisma(c.env);
  const ref = c.req.param('ref');
  
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }
  
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;
  
  console.log('Verify payment called:', { ref, razorpay_payment_id, razorpay_order_id, has_signature: !!razorpay_signature });

  try {
    // 1. Signature Verification using Web Crypto API
    const secret = c.env.RAZORPAY_KEY_SECRET;
    
    if (!secret) {
      console.error('RAZORPAY_KEY_SECRET is not set!');
      return c.json({ error: 'Payment configuration error' }, 500);
    }

    let signatureValid = false;
    try {
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
      
      signatureValid = (generatedSignature === razorpay_signature);
      console.log('Signature check:', { valid: signatureValid, generated: generatedSignature?.substring(0, 10) + '...' });
    } catch (cryptoErr) {
      console.error('Crypto error during verification:', cryptoErr.message);
      return c.json({ error: 'Signature verification failed: ' + cryptoErr.message }, 500);
    }

    if (!signatureValid) {
      return c.json({ error: 'Payment verification failed. Signature mismatch.' }, 400);
    }

    // 2. Find and update booking
    const existingBooking = await prisma.booking.findUnique({
      where: { referenceNumber: ref }
    });
    
    if (!existingBooking) {
      console.error('Booking not found for ref:', ref);
      return c.json({ error: `Booking not found: ${ref}` }, 404);
    }

    const booking = await prisma.booking.update({
      where: { referenceNumber: ref },
      data: { status: 'PAID' },
      include: { resort: true }
    });

    // 3. Create Notification Asynchronously
    c.executionCtx.waitUntil(
      prisma.notification.create({
        data: {
          userId: booking.userId,
          title: 'Booking Confirmed!',
          message: `Payment successful for ${booking.resort.name}. Reference: ${ref}`,
          type: 'booking'
        }
      }).catch(notifErr => console.warn('Async notification creation failed:', notifErr.message))
    );

    return c.json({ success: true, booking });
  } catch (err) { 
    console.error('Verification Error:', err.message, err.stack);
    return c.json({ error: err.message }, 500); 
  }
});

app.patch('/bookings/:id/cancel', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  try {
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { resort: true }
    });

    c.executionCtx.waitUntil(
      prisma.notification.create({
        data: {
          userId: booking.userId,
          title: 'Booking Cancelled 😔',
          message: `Your booking at ${booking.resort.name} has been cancelled successfully.`,
          type: 'booking'
        }
      }).catch(err => console.error("Async cancel notification failed:", err))
    );

    return c.json(booking);
  } catch (err) { 
    return c.json({ error: err.message }, 500); 
  }
});

app.patch('/bookings/:id/status', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  const { status } = await c.req.json();
  try {
    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: { resort: true }
    });

    c.executionCtx.waitUntil(
      prisma.notification.create({
        data: {
          userId: booking.userId,
          title: `Booking Status Update!`,
          message: `Your booking at ${booking.resort.name} is now ${status}.`,
          type: 'booking'
        }
      }).catch(err => console.error("Async status notification failed:", err))
    );

    return c.json(booking);
  } catch (err) { 
    return c.json({ error: err.message }, 500); 
  }
});


// Cloudinary Upload Signature — uses native Web Crypto API for edge runtime compatibility
app.get('/upload/signature', authMiddleware, async (c) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    const folder = 'hampi-stays';
    const apiSecret = c.env.CLOUDINARY_API_SECRET;
    
    if (!apiSecret) {
      return c.json({ error: 'CLOUDINARY_API_SECRET is not configured' }, 500);
    }

    // Cloudinary requires signature: sha1(folder=hampi-stays&timestamp=123456... + api_secret)
    const signString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(signString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return c.json({
      signature,
      timestamp,
      cloud_name: c.env.CLOUDINARY_CLOUD_NAME,
      api_key: c.env.CLOUDINARY_API_KEY,
      folder
    });
  } catch (err) {
    console.error('Upload signature error:', err);
    return c.json({ error: 'Failed to generate upload signature: ' + err.message }, 500);
  }
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

// Local Guides
app.get('/guides/profile/:userId', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const userId = c.req.param('userId');
  try {
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
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return c.json({ error: 'User not found' }, 404);
      if (user.role !== 'GUIDE') return c.json({ error: 'User is not a guide' }, 400);

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

    return c.json(guide);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.patch('/guides/profile/:userId', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const userId = c.req.param('userId');
  const payload = c.get('user');
  
  if (payload.userId !== userId && payload.role !== 'ADMIN') {
    return c.json({ error: 'Unauthorized to update this profile' }, 403);
  }

  try {
    const { bio, pricePerDay, pricePerHour, specialties, languages, idType, idNumber, idImage, avatar } = await c.req.json();
    let guide = await prisma.guideProfile.findUnique({ where: { userId } });
    if (!guide) return c.json({ error: 'Guide profile not found' }, 404);

    let verificationStatus = guide.status;
    if (idImage && idImage !== guide.idImage) {
      verificationStatus = 'PENDING';
    }

    const updatedGuide = await prisma.guideProfile.update({
      where: { userId },
      data: {
        bio,
        pricePerDay: pricePerDay ? parseFloat(pricePerDay) : undefined,
        pricePerHour: pricePerHour ? parseFloat(pricePerHour) : undefined,
        specialties,
        languages,
        idType,
        idNumber,
        idImage,
        status: verificationStatus
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

    await prisma.user.update({
      where: { id: userId },
      data: {
        avatar: avatar || undefined,
        idType: idType || undefined,
        idNumber: idNumber || undefined,
        idImage: idImage || undefined,
        kycStatus: idImage && idImage !== guide.idImage ? 'PENDING' : undefined
      }
    });

    return c.json(updatedGuide);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/guides', async (c) => {
  const prisma = getPrisma(c.env);
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
    return c.json(guides);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/guides/:id/bookings', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const guideId = c.req.param('id');
  try {
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
    return c.json(bookings);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/guides/:id', async (c) => {
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  try {
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
    if (!guide) return c.json({ error: 'Guide not found' }, 404);
    return c.json(guide);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.post('/guides/:guideId/book', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const guideId = c.req.param('guideId');
  const { userId, date, durationHours, meetingPoint, totalPrice, specialRequests } = await c.req.json();
  try {
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
    return c.json(booking, 201);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.patch('/guide-bookings/:bookingId/status', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const bookingId = c.req.param('bookingId');
  const { status } = await c.req.json();
  const payload = c.get('user');
  try {
    const existingBooking = await prisma.guideBooking.findUnique({
      where: { id: bookingId },
      include: { guide: true }
    });

    if (!existingBooking) return c.json({ error: 'Booking not found' }, 404);

    if (
      payload.userId !== existingBooking.userId &&
      payload.userId !== existingBooking.guide.userId &&
      payload.role !== 'ADMIN'
    ) {
      return c.json({ error: 'Unauthorized to update this booking' }, 403);
    }

    const booking = await prisma.guideBooking.update({
      where: { id: bookingId },
      data: { status }
    });

    return c.json(booking);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// Experiences
app.get('/experiences', async (c) => {
  const prisma = getPrisma(c.env);
  try {
    const experiences = await prisma.experience.findMany({
      include: {
        guide: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    });
    return c.json(experiences);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/experiences/:id', async (c) => {
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  try {
    const experience = await prisma.experience.findUnique({
      where: { id },
      include: {
        guide: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    });
    if (!experience) return c.json({ error: 'Experience not found' }, 404);
    return c.json(experience);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// Error Handling
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

export default app;


