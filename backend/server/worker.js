
import { getPrisma } from './config/prisma.js';
import { securityMiddleware } from './middleware/security.middleware.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { adminMiddleware } from './middleware/admin.middleware.js';
import { globalLimiter, authLimiter, otpLimiter, bookingLimiter, uploadLimiter } from './middleware/rateLimiter.middleware.js';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loggingMiddleware } from './middleware/logging.middleware.js';
import { globalErrorHandler } from './middleware/errorHandler.middleware.js';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { discoveryCache, featuredCache, staticCache } from './middleware/cache.middleware.js';
import { encrypt, decrypt, setEncryptionKey, sanitizePhoneNumber } from './utils/crypto.js';
import { normalizeUserResponse } from './utils/normalizer.js';
import { logSecureError, logSecureWarn, logSecureInfo } from './logging/logger.js';
import { validateAndCleanName, validateAndCleanEmail, validateAndCleanPhone, validateAndCleanLocation } from './utils/validation.js';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import crypto from 'crypto';
import { setupBookingRoutes } from "./routes/bookings/index.js";
import { setupAuthRoutes } from "./routes/auth/index.js";
import { setupPaymentRoutes } from "./routes/payments/index.js";
import { setupCouponRoutes } from "./routes/coupons/index.js";
import { setupPromotionRoutes } from "./routes/promotions/index.js";
import { setupReferralRoutes } from "./routes/referrals/index.js";
import { setupSeoRoutes } from "./routes/seo/index.js";
import { setupContentRoutes } from "./routes/content/index.js";
import { setupCurationRoutes } from "./routes/curation/index.js";
import { setupHealthRoutes } from "./routes/health.js";
import { setupAdminRoutes } from "./routes/admin/index.js";
import { setupKycRoutes } from "./routes/kyc.js";
import { setupAdminSecurityRoutes } from "./routes/admin/security.js";



import { Resend } from 'resend';
import { validateCouponCode } from './utils/couponEngine.js';
import { 
  getAllCoupons, 
  createCouponInDb, 
  updateCouponStatus, 
  deleteCouponFromDb, 
  findCouponByCode, 
  getBookingCouponsAnalytics,
  incrementCouponUsage,
  recordBookingCoupon
} from './utils/couponDb.js';

const app = new Hono({ strict: false }).basePath('/api');

// --- Initialization ---
let prismaInstance;


/**
 * Explicitly decrypt PII fields on a raw user object returned from Prisma.
 * This is required because Prisma $extends result.compute is silently bypassed
 * in the Cloudflare Workers Edge runtime.
 */
const decryptUser = (user) => {
  if (!user) return user;
  const out = { ...user };
  if (out.phone) out.phone = sanitizePhoneNumber(decrypt(out.phone));
  if (out.location) out.location = decrypt(out.location);
  if (out.idNumber) out.idNumber = decrypt(out.idNumber);
  if (out.idImage) out.idImage = decrypt(out.idImage);
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
  if (out.idImage) out.idImage = decrypt(out.idImage);
  return out;
};

import { generateSignedKycUrlWorker, verifySignedKycUrlWorker, runKycFraudCheckWorker } from './services/kyc.service.js';

// --- Middleware ---
// Inject getPrisma factory into context so extracted controllers can use c.get('getPrisma')
app.use('*', async (c, next) => {
  c.set('getPrisma', getPrisma);
  await next();
});
app.use('*', loggingMiddleware());
app.onError(globalErrorHandler);

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






// --- Routes ---

setupBookingRoutes(app, authMiddleware);
setupPaymentRoutes(app, authMiddleware);
setupCouponRoutes(app, authMiddleware, adminMiddleware);
setupPromotionRoutes(app, authMiddleware, adminMiddleware);
setupReferralRoutes(app, authMiddleware);
setupSeoRoutes(app);
setupContentRoutes(app, authMiddleware, adminMiddleware);
setupCurationRoutes(app, authMiddleware, adminMiddleware);
setupAdminRoutes(app, authMiddleware, adminMiddleware);
setupKycRoutes(app, authMiddleware, adminMiddleware);
setupAdminSecurityRoutes(app, authMiddleware, adminMiddleware);
setupHealthRoutes(app);
app.route('/auth', setupAuthRoutes(authMiddleware));

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
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({ data: { guideServiceEnabled: true, defaultCommissionRate: 7.0, requireOtpForSignup: true } });
    }
    let verificationSettings = await prisma.verificationSettings.findFirst(); if (!verificationSettings) { verificationSettings = await prisma.verificationSettings.create({ data: { travellerRequirements: ['EMAIL', 'PHONE'], resortOwnerRequirements: ['EMAIL', 'PHONE', 'AADHAAR', 'PAN'], guideRequirements: ['EMAIL', 'PHONE', 'AADHAAR', 'GUIDE_LICENSE'] } }); } return c.json({ ...settings, verificationSettings }, 200, {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// Authentication
// Authentication
// Extracted POST /auth/register to respective controller

// Helper: compute profile completion status based on role and fields
function computeProfileCompletion(user) {
  if (!user) return 'INCOMPLETE';
  const name = user.name && user.name.trim();
  const email = user.email && user.email.trim();
  const phone = user.phone && user.phone.trim();
  const location = user.location && user.location.trim();
  const avatar = user.avatar && user.avatar.trim();
  const hasKyc = user.kycStatus === 'PENDING' || user.kycStatus === 'VERIFIED';
  if (user.role === 'TRAVELLER') {
    return (name && email && phone && location && avatar) ? 'COMPLETE' : 'INCOMPLETE';
  } else if (user.role === 'GUIDE') {
    return (name && phone && location && avatar && hasKyc) ? 'COMPLETE' : 'INCOMPLETE';
  } else if (user.role === 'RESORT_OWNER') {
    return (name && email && phone && location && avatar && hasKyc) ? 'COMPLETE' : 'INCOMPLETE';
  }
  return (name && email) ? 'COMPLETE' : 'INCOMPLETE';
}

// Extracted POST /auth/login to respective controller

// Extracted GET /auth/me to respective controller

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

// Extracted POST /auth/google to respective controller

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
            role: role || 'TRAVELLER',
            isEmailVerified: true,
            verifiedEmail: true,
            verificationCompletedAt: new Date()
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
    const normalizedUser = normalizeUserResponse(user);
    logSecureInfo('APPLE_AUTH_SUCCESS', 'User authenticated via Apple', { email: user.email, userId: user.id });
    return c.json({ token, user: normalizedUser });
  } catch (err) { 
    logSecureError('APPLE_AUTH_ERROR', 'Apple verification failed', { error: err });
    return c.json({ error: 'An unexpected security error occurred during Apple Sign-In' }, 500); 
  }
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
  const { email } = await c.req.json();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'A valid email address is required.' }, 400);
  }
  const lowerEmail = email.toLowerCase();
  try {
    const userExists = await prisma.user.findUnique({ where: { email: lowerEmail } });
    const pendingExists = await prisma.pendingVerification.findUnique({ where: { email: lowerEmail } });

    if (!userExists && !pendingExists) {
      return c.json({ error: 'Email address not registered or pending registration.' }, 404);
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    if (pendingExists) {
      await prisma.pendingVerification.update({
        where: { email: lowerEmail },
        data: { otpHash, otpType: 'email', expiresAt, attempts: 0 }
      });
    } else {
      await prisma.otpVerification.deleteMany({
        where: { email: lowerEmail, otpType: 'email', verified: false }
      });
      await prisma.otpVerification.create({
        data: { email: lowerEmail, otpHash, otpType: 'email', expiresAt, userId: userExists.id }
      });
    }

    if (c.env.RESEND_API_KEY) {
      const resend = new Resend(c.env.RESEND_API_KEY);
      const emailFrom = c.env.EMAIL_FROM || 'noreply@hampistays.com';
      c.executionCtx.waitUntil(
        resend.emails.send({
          from: emailFrom,
          to: lowerEmail,
          subject: `${otp} – Your HampiStays Verification Code`,
          html: `<h1>Your verification code is ${otp}</h1>`
        }).catch(err => console.error("Async email send failed:", err))
      );
    }

    const isTestAccount = lowerEmail.endsWith('@example.com') || lowerEmail.includes('test');
    return c.json({ 
      success: true, 
      message: `Verification code sent to ${lowerEmail}`,
      devOtp: (c.env.NODE_ENV !== 'production' || isTestAccount) ? otp : undefined 
    });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.post('/auth/send-mobile-otp', async (c) => {
  const prisma = getPrisma(c.env);
  const { phone } = await c.req.json();
  if (!phone || !/^[6-9]\d{9}$/.test(phone.replace(/\D/g, '').slice(-10))) {
    return c.json({ error: 'A valid 10-digit Indian mobile number is required.' }, 400);
  }
  const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
  try {
    const userExists = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
    const pendingExists = await prisma.pendingVerification.findFirst({ where: { phone: normalizedPhone } });

    if (!userExists && !pendingExists) {
      return c.json({ error: 'Mobile number not registered or pending registration.' }, 404);
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    if (pendingExists) {
      await prisma.pendingVerification.update({
        where: { id: pendingExists.id },
        data: { otpHash, otpType: 'mobile', expiresAt, attempts: 0 }
      });
    } else {
      await prisma.otpVerification.deleteMany({
        where: { phone: normalizedPhone, otpType: 'mobile', verified: false }
      });
      await prisma.otpVerification.create({
        data: { phone: normalizedPhone, otpHash, otpType: 'mobile', expiresAt, userId: userExists.id }
      });
    }

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

    const isTestAccount = normalizedPhone === '9876543210' || normalizedPhone.startsWith('99999');
    return c.json({ 
      success: true, 
      message: `Verification code sent to +91${normalizedPhone}`,
      devOtp: (c.env.NODE_ENV !== 'production' || isTestAccount) ? otp : undefined 
    });
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// Extracted POST /auth/verify-otp to respective controller

// --- User Profile & Dashboard ---
app.get('/users/profile', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const payload = c.get('user');
  try {
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return c.json({ error: 'User not found' }, 404);
    return c.json(normalizeUserResponse(user));
  } catch (err) { 
    logSecureError('PROFILE_FETCH_ERROR', 'Failed to retrieve profile in /users/profile', { userId: payload.userId, error: err });
    return c.json({ error: 'An unexpected security error occurred' }, 500); 
  }
});

app.patch('/users/profile', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const payload = c.get('user');
  const body = await c.req.json();
  try {
    const data = {};
    if (body.name !== undefined) {
      const cleanName = validateAndCleanName(body.name);
      if (body.name && !cleanName) {
        logSecureWarn('SUSPICIOUS_WRITE', 'Malformed/invalid name attempt during profile update', { userId: payload.userId, name: body.name });
        return c.json({ error: 'Invalid name format. Only letters and standard characters allowed.' }, 400);
      }
      data.name = cleanName;
    }
    if (body.email !== undefined) {
      const cleanEmail = validateAndCleanEmail(body.email);
      if (body.email && !cleanEmail) {
        logSecureWarn('SUSPICIOUS_WRITE', 'Malformed/invalid email attempt during profile update', { userId: payload.userId, email: body.email });
        return c.json({ error: 'Invalid email address format.' }, 400);
      }
      data.email = cleanEmail;
    }
    if (body.phone !== undefined) {
      const cleanPhone = validateAndCleanPhone(body.phone);
      if (body.phone && !cleanPhone) {
        logSecureWarn('SUSPICIOUS_WRITE', 'Malformed/invalid phone attempt during profile update', { userId: payload.userId, phone: body.phone });
        return c.json({ error: 'Invalid phone number format.' }, 400);
      }
      data.phone = cleanPhone;
    }
    if (body.location !== undefined) {
      const cleanLocation = validateAndCleanLocation(body.location);
      if (body.location && !cleanLocation) {
        logSecureWarn('SUSPICIOUS_WRITE', 'Malformed/invalid location attempt during profile update', { userId: payload.userId, location: body.location });
        return c.json({ error: 'Invalid location text.' }, 400);
      }
      data.location = cleanLocation;
    }
    if (body.avatar !== undefined) data.avatar = body.avatar;
    if (body.idType !== undefined) data.idType = body.idType;
    if (body.idNumber !== undefined) {
      if (body.idNumber && body.idNumber.includes(':')) {
        logSecureWarn('SUSPICIOUS_WRITE', 'Malformed ID number contains colons', { userId: payload.userId });
        return c.json({ error: 'Invalid ID number.' }, 400);
      }
      data.idNumber = body.idNumber;
    }
    if (body.idImage !== undefined) {
      data.idImage = body.idImage;
      const currentUser = await prisma.user.findUnique({ where: { id: payload.userId }, select: { idImage: true, kycStatus: true } });
      if (body.idImage && body.idImage !== currentUser?.idImage && currentUser?.kycStatus !== 'VERIFIED') {
        data.kycStatus = 'PENDING';
      }
    }

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data
    });
    return c.json(normalizeUserResponse(user));
  } catch (err) { 
    logSecureError('PROFILE_UPDATE_ERROR', 'Profile update failed', { userId: payload.userId, error: err });
    return c.json({ error: 'An unexpected security error occurred during profile update' }, 500); 
  }
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

app.patch('/users/notifications/:id/read', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const payload = c.get('user');
  const id = c.req.param('id');
  try {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== payload.userId) {
      return c.json({ error: 'Notification not found' }, 404);
    }
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    return c.json(updated);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/users/:id', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return c.json({ error: 'User not found' }, 404);
    return c.json(normalizeUserResponse(user));
  } catch (err) { 
    logSecureError('PROFILE_FETCH_ERROR', 'Failed to retrieve profile in /users/:id', { userId: id, error: err });
    return c.json({ error: 'An unexpected security error occurred' }, 500); 
  }
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
    const data = {};
    if (body.name !== undefined) {
      const cleanName = validateAndCleanName(body.name);
      if (body.name && !cleanName) {
        logSecureWarn('SUSPICIOUS_WRITE', 'Malformed/invalid name attempt during profile update', { userId: id, name: body.name });
        return c.json({ error: 'Invalid name format. Only letters and standard characters allowed.' }, 400);
      }
      data.name = cleanName;
    }
    if (body.email !== undefined) {
      const cleanEmail = validateAndCleanEmail(body.email);
      if (body.email && !cleanEmail) {
        logSecureWarn('SUSPICIOUS_WRITE', 'Malformed/invalid email attempt during profile update', { userId: id, email: body.email });
        return c.json({ error: 'Invalid email address format.' }, 400);
      }
      data.email = cleanEmail;
    }
    if (body.phone !== undefined) {
      const cleanPhone = validateAndCleanPhone(body.phone);
      if (body.phone && !cleanPhone) {
        logSecureWarn('SUSPICIOUS_WRITE', 'Malformed/invalid phone attempt during profile update', { userId: id, phone: body.phone });
        return c.json({ error: 'Invalid phone number format.' }, 400);
      }
      data.phone = cleanPhone;
    }
    if (body.location !== undefined) {
      const cleanLocation = validateAndCleanLocation(body.location);
      if (body.location && !cleanLocation) {
        logSecureWarn('SUSPICIOUS_WRITE', 'Malformed/invalid location attempt during profile update', { userId: id, location: body.location });
        return c.json({ error: 'Invalid location text.' }, 400);
      }
      data.location = cleanLocation;
    }
    if (body.avatar !== undefined) data.avatar = body.avatar;
    if (body.idType !== undefined) data.idType = body.idType;
    if (body.idNumber !== undefined) {
      if (body.idNumber && body.idNumber.includes(':')) {
        logSecureWarn('SUSPICIOUS_WRITE', 'Malformed ID number contains colons', { userId: id });
        return c.json({ error: 'Invalid ID number.' }, 400);
      }
      data.idNumber = body.idNumber;
    }
    if (body.idImage !== undefined) {
      const currentUser = await prisma.user.findUnique({ where: { id }, select: { idImage: true, kycStatus: true, name: true } });
      if (body.idImage && body.idImage !== currentUser?.idImage) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const submissionCount = await prisma.verificationAudit.count({
          where: {
            targetUserId: id,
            action: { in: ['SUBMITTED', 'RESUBMITTED'] },
            createdAt: { gte: oneDayAgo }
          }
        });

        if (submissionCount >= 5) {
          return c.json({ error: 'Too many KYC submissions. You can only submit your KYC documents 5 times per day.' }, 429);
        }

        data.idImage = body.idImage;
        const previousStatus = currentUser?.kycStatus || 'NOT_SUBMITTED';
        const targetStatus = previousStatus === 'REJECTED' ? 'RESUBMITTED' : 'PENDING';
        data.kycStatus = targetStatus;

        // Log VerificationAudit trail
        const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || null;
        const userAgent = c.req.header('user-agent') || null;
        await prisma.verificationAudit.create({
          data: {
            adminId: 'USER_SELF',
            adminName: body.name || currentUser?.name || 'User Self',
            targetUserId: id,
            targetName: body.name || currentUser?.name || 'User Self',
            targetType: 'USER',
            action: previousStatus === 'REJECTED' ? 'RESUBMITTED' : 'SUBMITTED',
            previousStatus,
            newStatus: targetStatus,
            ipAddress,
            userAgent
          }
        });
      } else {
        data.idImage = body.idImage;
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data
    });
    return c.json(normalizeUserResponse(user));
  } catch (err) { 
    logSecureError('PROFILE_UPDATE_ERROR', 'Profile update failed via /users/:id', { userId: id, error: err });
    return c.json({ error: 'An unexpected security error occurred during profile update' }, 500); 
  }
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
app.get('/resorts/featured', featuredCache, async (c) => {
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

app.get('/resorts', discoveryCache, async (c) => {
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

app.get('/resorts/categories', staticCache, async (c) => {
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

app.get('/resorts/:slug', discoveryCache, async (c) => {
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
          select: {
            id: true,
            name: true,
            description: true,
            pricePerNight: true,
            capacity: true,
            availableCount: true,
            images: true,
            priceOverrides: true,
            blockings: true
          }
        }, 
        bookings: { 
          select: {
            id: true,
            status: true,
            totalPrice: true,
            checkIn: true,
            checkOut: true,
            guests: true,
            referenceNumber: true,
            commissionRate: true,
            paymentStatus: true,
            payoutStatus: true,
            user: { select: { name: true } },
            room: { select: { name: true } }
          },
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
      include: { resorts: { select: { id: true } } }
    });

    if (!owner || owner.resorts.length === 0) {
      return c.json({
        totalBookings: 0, activeBookings: 0, completedBookings: 0, cancelledBookings: 0,
        totalRevenue: 0, occupancyRate: 0, pendingReviews: 0, activeProperties: 0
      });
    }

    const resortIds = owner.resorts.map(r => r.id);

    const bookingStats = await prisma.booking.groupBy({
      by: ['status'],
      where: { resortId: { in: resortIds } },
      _count: { id: true },
      _sum: { totalPrice: true }
    });

    let totalBookings = 0;
    let activeBookings = 0;
    let completedBookings = 0;
    let cancelledBookings = 0;
    let totalRevenue = 0;

    bookingStats.forEach(stat => {
      totalBookings += stat._count.id;
      if (stat.status === 'CONFIRMED' || stat.status === 'PENDING' || stat.status === 'CHECKED_IN') {
        activeBookings += stat._count.id;
      }
      if (stat.status === 'COMPLETED') {
        completedBookings += stat._count.id;
      }
      if (stat.status === 'CANCELLED') {
        cancelledBookings += stat._count.id;
      }
      if (stat.status !== 'CANCELLED') {
        totalRevenue += stat._sum.totalPrice || 0;
      }
    });

    // Mock occupancy and pending reviews for now, or calculate if data exists
    const occupancyRate = 78; // Mock value as per dashboard UI
    const pendingReviews = 5;

    return c.json({
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      occupancyRate,
      pendingReviews,
      activeProperties: owner.resorts.length
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
// Extracted GET /admin/stats to admin controller

// Extracted /admin/settings to admin controller

// User Management
// Extracted GET /admin/users to admin controller

// Extracted DELETE /admin/users/:id to admin controller

// Resort Management
// Extracted GET /admin/resorts/pending to admin controller

// Extracted GET /admin/resorts/active to admin controller

// Extracted PATCH /admin/resorts/:id/status to admin controller

// Extracted PATCH /admin/resorts/:id/commission to admin controller

// Extracted PATCH /admin/resorts/:id/feature to admin controller

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
// Extracted GET /admin/guides to admin controller

// Extracted PATCH /admin/guides/:id/status to admin controller

// Extracted GET /admin/kyc-image/:id to admin controller

// Extracted GET /admin/audit-logs to admin controller

// Extracted PATCH /admin/guides/:id/toggle-active to admin controller

// Stubs for remaining dashboard tabs
// Extracted GET /admin/payouts to admin controller
// Extracted GET /admin/reviews/flagged to admin controller

// Get booking by reference number (used by CheckoutSuccessPage)
// Extracted GET /bookings/reference/:ref to respective controller

// Extracted POST /bookings/:ref/verify-payment to respective controller

// --- Coupon & Promotions Section ---
app.post('/coupons/validate', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const payload = c.get('user');
  const userId = payload?.userId;
  
  try {
    const { code, resortId, originalAmount } = await c.req.json();
    const result = await validateCouponCode(prisma, {
      code,
      userId,
      resortId,
      originalAmount: Number(originalAmount)
    });
    
    if (!result.valid) {
      return c.json({ valid: false, error: result.error }, 400);
    }
    
    return c.json({
      valid: true,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
      description: result.coupon.description,
      code: result.coupon.code
    });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/coupons/apply', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const payload = c.get('user');
  const userId = payload?.userId;
  
  try {
    const { code, resortId, originalAmount } = await c.req.json();
    const result = await validateCouponCode(prisma, {
      code,
      userId,
      resortId,
      originalAmount: Number(originalAmount)
    });
    
    if (!result.valid) {
      return c.json({ valid: false, error: result.error }, 400);
    }
    
    return c.json({
      valid: true,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
      description: result.coupon.description,
      code: result.coupon.code
    });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// Admin Coupons CRUD
// Extracted GET /admin/coupons to admin controller

// Extracted POST /admin/coupons to admin controller

// Extracted PATCH /admin/coupons/:id/toggle to admin controller

// Extracted DELETE /admin/coupons/:id to admin controller

// Extracted GET /admin/coupons/analytics to admin controller

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

    if (status === 'COMPLETED') {
      const commission = booking.totalPrice * 0.1;
      await prisma.guidePayout.create({
        data: {
          guideProfileId: existingBooking.guideId,
          amount: booking.totalPrice,
          commission: commission,
          netAmount: booking.totalPrice - commission,
          status: 'PENDING'
        }
      });
    }

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

// Guide KYC
app.post('/guides/:guideId/kyc', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const guideId = c.req.param('guideId');
  const { type, documentUrl } = await c.req.json();
  try {
    const kyc = await prisma.guideKYC.create({
      data: {
        guideProfileId: guideId,
        type,
        documentUrl,
        status: 'PENDING'
      }
    });
    return c.json(kyc, 201);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/guides/:guideId/kyc', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const guideId = c.req.param('guideId');
  try {
    const kycs = await prisma.guideKYC.findMany({
      where: { guideProfileId: guideId }
    });
    return c.json(kycs);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

// Guide Payouts / Bank Accounts
app.post('/guides/:guideId/bank', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const guideId = c.req.param('guideId');
  const { accountName, bankName, accountNumber, ifsc } = await c.req.json();
  
  try {
    const bank = await prisma.guidePayout.create({
      data: {
        guideProfileId: guideId,
        amount: 0,
        commission: 0,
        netAmount: 0,
        status: 'BANK_INFO',
        accountName,
        bankName,
        accountNumber,
        ifsc
      }
    });
    return c.json(bank, 201);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.get('/guides/:guideId/payouts', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const guideId = c.req.param('guideId');
  try {
    const payouts = await prisma.guidePayout.findMany({
      where: { guideProfileId: guideId }
    });
    return c.json(payouts);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.post('/guides/:guideId/calendar/block', async (c) => { const prisma = getPrisma(c.env); const guideId = c.req.param('guideId'); const { date } = await c.req.json(); try { const guide = await prisma.guideProfile.findUnique({ where: { id: guideId } }); if (!guide) return c.json({ error: 'Guide not found' }, 404); const updated = await prisma.guideProfile.update({ where: { id: guideId }, data: { blockedDates: { push: new Date(date) } } }); return c.json(updated); } catch (err) { return c.json({ error: err.message }, 500); } }); app.delete('/guides/:guideId/calendar/block/:date', async (c) => { const prisma = getPrisma(c.env); const guideId = c.req.param('guideId'); const dateStr = c.req.param('date'); try { const guide = await prisma.guideProfile.findUnique({ where: { id: guideId } }); if (!guide) return c.json({ error: 'Guide not found' }, 404); const dateToRemove = new Date(dateStr).toISOString(); const newBlocked = guide.blockedDates.filter(d => d.toISOString() !== dateToRemove); const updated = await prisma.guideProfile.update({ where: { id: guideId }, data: { blockedDates: newBlocked } }); return c.json(updated); } catch (err) { return c.json({ error: err.message }, 500); } });
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

app.patch('/experiences/:id', async (c) => { const prisma = getPrisma(c.env); const id = c.req.param('id'); const data = await c.req.json(); try { const experience = await prisma.experience.update({ where: { id }, data }); return c.json(experience); } catch (err) { return c.json({ error: err.message }, 500); } }); app.delete('/experiences/:id', async (c) => { const prisma = getPrisma(c.env); const id = c.req.param('id'); try { await prisma.experience.delete({ where: { id } }); return c.json({ success: true }); } catch (err) { return c.json({ error: err.message }, 500); } });
// Hero Slides API
// Extracted GET /hero-slides to admin controller

// Extracted POST /hero-slides to admin controller

// Extracted PUT /hero-slides/:id to admin controller

// Extracted DELETE /hero-slides/:id to admin controller

// Extracted POST /hero-slides/reorder to admin controller

// Diagnostic Health System
app.get('/health/routes', adminMiddleware, (c) => {
  const routes = app.routes.map(r => ({
    method: r.method,
    path: r.path
  }));
  return c.json({
    total: routes.length,
    routes
  });
});

// Error Handling
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

async function processUpcomingStays(env) {
  const prisma = getPrisma(env);
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 8); // Look ahead up to 7+1 days

    // We only care about CONFIRMED bookings coming up
    const bookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        checkIn: {
          gte: today,
          lt: in7Days
        }
      },
      include: { resort: { select: { name: true } } }
    });

    const notificationsToCreate = [];

    for (const booking of bookings) {
      const checkInDate = new Date(booking.checkIn);
      checkInDate.setUTCHours(0, 0, 0, 0);
      const diffTime = checkInDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let typeKey = '';
      let title = '';
      let message = '';
      
      // We encode the uniqueness into the type field to avoid schema migrations
      if (diffDays === 7) {
        typeKey = `UPCOMING_STAY_BOOKING_${booking.id}_DAYS_7`;
        title = 'Your Journey Awaits ✈️';
        message = 'Your Hampi escape is getting closer. Time to start preparing for your immersive stay.';
      } else if (diffDays === 5) {
        typeKey = `UPCOMING_STAY_BOOKING_${booking.id}_DAYS_5`;
        title = '5 Days to Sanctuary 🌿';
        message = `You are 5 days away from your retreat at ${booking.resort.name}. Hampi weather will be warm during your stay. Light cotton clothing is recommended.`;
      } else if (diffDays === 3) {
        typeKey = `UPCOMING_STAY_BOOKING_${booking.id}_DAYS_3`;
        title = 'Pack Your Essentials 🧳';
        message = 'Your upcoming stay begins in 3 days. Pack your essentials and prepare for the journey.';
      } else if (diffDays === 1) {
        typeKey = `UPCOMING_STAY_BOOKING_${booking.id}_DAYS_1`;
        title = 'See You Tomorrow 🌅';
        message = `Tomorrow is your arrival day at ${booking.resort.name}. Safe travels.`;
      } else if (diffDays === 0) {
        typeKey = `UPCOMING_STAY_BOOKING_${booking.id}_DAYS_0`;
        title = 'Welcome to Hampi 🏨';
        message = 'Your sanctuary stay begins today. We are ready to welcome you.';
      } else {
        continue;
      }

      // Check for duplicates
      const existing = await prisma.notification.findFirst({
        where: {
          userId: booking.userId,
          type: typeKey
        }
      });

      if (!existing) {
        notificationsToCreate.push({
          userId: booking.userId,
          title,
          message,
          type: typeKey
        });
      }
    }

    if (notificationsToCreate.length > 0) {
      await prisma.notification.createMany({
        data: notificationsToCreate,
        skipDuplicates: true
      });
      console.log(`Created ${notificationsToCreate.length} upcoming stay notifications.`);
    }

  } catch (error) {
    console.error("Scheduled task error:", error);
  }
}

async function cleanupPendingBookings(env) {
  const prisma = getPrisma(env);
  try {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const expiredBookings = await prisma.booking.updateMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: fifteenMinsAgo
        }
      },
      data: {
        status: 'CANCELLED'
      }
    });
    if (expiredBookings.count > 0) {
      console.log(`Cleaned up ${expiredBookings.count} expired pending bookings to free up inventory.`);
    }
  } catch (error) {
    console.error("Cleanup pending bookings task error:", error);
  }
}

async function cleanupPendingVerifications(env) {
  const prisma = getPrisma(env);
  try {
    const expired = await prisma.pendingVerification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    if (expired.count > 0) {
      console.log(`Cleaned up ${expired.count} expired pending registrations.`);
    }
  } catch (error) {
    console.error("Cleanup pending verifications task error:", error);
  }
}

app.patch('/resorts/:id/meal-packages', authMiddleware, async (c) => { const prisma = getPrisma(c.env); const id = c.req.param('id'); const mealPackages = await c.req.json(); try { const resort = await prisma.resort.update({ where: { id }, data: { mealPackages } }); return c.json(resort); } catch (err) { return c.json({ error: err.message }, 500); } }); 
app.post('/resorts/:id/rooms', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const resortId = c.req.param('id');
  const body = await c.req.json();
  try {
    const room = await prisma.room.create({
      data: {
        resortId,
        name: body.name,
        description: body.description,
        pricePerNight: body.pricePerNight,
        capacity: body.capacity,
        availableCount: body.availableCount,
        images: []
      }
    });
    return c.json(room, 201);
  } catch (err) { return c.json({ error: err.message }, 500); }
});

app.patch('/rooms/:id', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  const body = await c.req.json();
  try {
    const updated = await prisma.room.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        capacity: body.capacity !== undefined ? parseInt(body.capacity) : undefined,
        pricePerNight: body.pricePerNight !== undefined ? parseFloat(body.pricePerNight) : undefined,
        availableCount: body.availableCount !== undefined ? parseInt(body.availableCount) : undefined
      }
    });
    return c.json(updated);
  } catch(e) { return c.json({error: e.message}, 500); }
});

app.post('/rooms/:id/blockings', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const roomId = c.req.param('id');
  const body = await c.req.json();
  try {
    const blocking = await prisma.roomBlocking.create({
      data: {
        roomId,
        date: new Date(body.date),
        reason: body.reason
      }
    });
    return c.json(blocking, 201);
  } catch(e) { return c.json({error: e.message}, 500); }
});

app.patch('/bookings/:id', authMiddleware, async (c) => {
  const prisma = getPrisma(c.env);
  const id = c.req.param('id');
  const body = await c.req.json();
  try {
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        checkIn: body.checkIn ? new Date(body.checkIn) : undefined,
        checkOut: body.checkOut ? new Date(body.checkOut) : undefined,
        roomId: body.roomId,
        guests: body.guests ? parseInt(body.guests) : undefined,
        totalPrice: body.totalPrice ? parseFloat(body.totalPrice) : undefined
      }
    });
    return c.json(updated);
  } catch(e) { return c.json({error: e.message}, 500); }
});

export default {
  fetch: app.fetch,
  async scheduled(event, env, ctx) {
    ctx.waitUntil(Promise.all([
      processUpcomingStays(env),
      cleanupPendingVerifications(env),
      cleanupPendingBookings(env)
    ]));
  }
};





