import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import crypto from 'crypto';
import { Resend } from 'resend';
import prisma from '../utils/prisma.js';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@hampistays.com';
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || '';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export const register = async (req, res, next) => {
  try {
    const { password, name, role, email: rawEmail, phone, verificationType } = req.body;
    const email = rawEmail.toLowerCase();
    
    const settings = await prisma.systemSettings.findFirst();
    if (role === 'GUIDE' && settings && !settings.guideServiceEnabled) {
      return res.status(403).json({ error: 'Guide registration is currently disabled by the administrator.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const normalizedPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
    if (normalizedPhone) {
      const existingPhone = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
      if (existingPhone) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }
    }

    const requireOtp = settings ? settings.requireOtpForSignup : true;
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    if (!requireOtp) {
      // Direct registration
      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            name,
            passwordHash,
            role: role || 'TRAVELLER',
            phone: normalizedPhone || null,
            isEmailVerified: verificationType !== 'sms',
            isMobileVerified: verificationType === 'sms',
            verifiedEmail: true,
            verifiedPhone: verificationType === 'sms',
            verificationCompletedAt: new Date()
          }
        });

        if (role === 'RESORT_OWNER') {
          await tx.resortOwner.create({
            data: { userId: newUser.id, businessName: `${name}'s Portfolio` }
          });
        } else if (role === 'GUIDE') {
          await tx.guideProfile.create({
            data: {
              userId: newUser.id,
              bio: "Certified Hampi Expert dedicated to sharing the majestic history of the Vijayanagara Empire.",
              specialties: ["Architecture", "History"],
              languages: ["English", "Kannada"],
              pricePerDay: 2500,
              pricePerHour: 500,
              yearsExperience: 0,
            }
          });
        }
        return newUser;
      });

      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({
        success: true,
        status: 'verified',
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
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Upsert into pending verifications
    await prisma.pendingVerification.upsert({
      where: { email },
      update: {
        name,
        phone: normalizedPhone,
        passwordHash,
        role: role || 'TRAVELLER',
        otpHash,
        otpType: verificationType || 'email',
        expiresAt,
        attempts: 0,
        createdAt: new Date()
      },
      create: {
        email,
        name,
        phone: normalizedPhone,
        passwordHash,
        role: role || 'TRAVELLER',
        otpHash,
        otpType: verificationType || 'email',
        expiresAt
      }
    });

    // Send OTP
    if (verificationType === 'sms' && normalizedPhone) {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const twilio = await import('twilio');
        const twilioClient = twilio.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await twilioClient.messages.create({
          body: `Your HampiStays verification code is: ${otp}. Valid for 5 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: `+91${normalizedPhone}`
        });
      }
    } else {
      if (resend) {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: email,
          subject: `${otp} – Your HampiStays Verification Code`,
          html: `<h1>Your verification code is ${otp}</h1>`
        });
      }
    }

    const isTestEmail = email.endsWith('@example.com') || email.includes('test');
    const isTestPhone = normalizedPhone === '9876543210' || normalizedPhone.startsWith('99999');
    const isTest = isTestEmail || isTestPhone;

    res.status(200).json({
      success: true,
      status: 'pending_verification',
      message: `Verification code sent via ${verificationType || 'email'}.`,
      devOtp: (process.env.NODE_ENV !== 'production' || isTest) ? otp : undefined
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { password, email: rawEmail } = req.body;
    const email = rawEmail.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.', code: 'INCORRECT_PASSWORD' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        location: user.location,
        idType: user.idType,
        idNumber: user.idNumber,
        idImage: user.idImage,
        kycStatus: user.kycStatus || 'NOT_SUBMITTED'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    const { credential, role } = req.body;
    
    // Verify Google ID Token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) return res.status(400).json({ error: 'Invalid token' });

    const userEmail = payload.email?.toLowerCase();
    if (!userEmail) return res.status(400).json({ error: 'Email not found in Google response' });

    let user = await prisma.user.findUnique({ where: { email: userEmail } });

    if (!user) {
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: userEmail,
            name: payload.name || 'Google Traveler',
            passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
            role: role || 'TRAVELLER',
            avatar: payload.picture,
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

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
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
  } catch (error) {
    next(error);
  }
};

export const appleAuth = async (req, res, next) => {
  try {
    const { id_token, user: userDetails, role } = req.body;
    const { sub: appleId, email } = await appleSignin.verifyIdToken(id_token, {
      audience: APPLE_CLIENT_ID,
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

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
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
  } catch (error) {
    next(error);
  }
};

export const checkEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email has been already used. Please use a different email ID to create an account.' });
    }
    
    res.json({ message: 'Email is available' });
  } catch (error) {
    next(error);
  }
};
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        location: user.location,
        idType: user.idType,
        idNumber: user.idNumber,
        idImage: user.idImage,
        kycStatus: user.kycStatus || 'NOT_SUBMITTED'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    
    if (!user) {
      return res.json({
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

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    console.log(`[PASSWORD_RESET_DEV_LINK] -> ${resetLink}`);

    if (resend) {
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
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
        });
      } catch (err) {
        console.error('Failed to send reset email:', err);
      }
    }

    res.json({
      success: true,
      message: 'If that email address is in our system, we have sent a password reset link to it.',
      devResetLink: process.env.NODE_ENV !== 'production' ? resetLink : undefined
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

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
      return res.status(400).json({ error: 'The password reset link is invalid or has expired. Please request a new link.' });
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
      return res.status(400).json({ error: 'The password reset link is invalid or has expired. Please request a new link.' });
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

    res.json({
      success: true,
      message: 'Your password has been successfully reset. You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const tokenStr = req.headers.authorization?.split(' ')[1] || req.body.token || req.body.refreshToken;
    if (!tokenStr) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tokenStr, JWT_SECRET, { ignoreExpiration: true });
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ token: newToken });
  } catch (error) {
    next(error);
  }
};
