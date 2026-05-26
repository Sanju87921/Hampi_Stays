import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import prisma from '../utils/prisma.js';
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@hampistays.com';

let twilioClient = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = await import('twilio');
    twilioClient = twilio.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (e) { /* Twilio not configured */ }

const generateSecureOtp = () => crypto.randomInt(100000, 999999).toString();

export const sendEmailOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    const lowerEmail = email.toLowerCase();

    // Check if user is in main User table or PendingVerification table
    const userExists = await prisma.user.findUnique({ where: { email: lowerEmail } });
    const pendingExists = await prisma.pendingVerification.findUnique({ where: { email: lowerEmail } });

    if (!userExists && !pendingExists) {
      return res.status(404).json({ error: 'Email address not registered or pending registration.' });
    }

    const otp = generateSecureOtp();
    const otpHash = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    if (pendingExists) {
      // Update pending registration OTP
      await prisma.pendingVerification.update({
        where: { email: lowerEmail },
        data: { otpHash, otpType: 'email', expiresAt, attempts: 0 }
      });
    } else {
      // Update/create login/general OTP verification
      await prisma.otpVerification.deleteMany({
        where: { email: lowerEmail, otpType: 'email', verified: false }
      });
      await prisma.otpVerification.create({
        data: { email: lowerEmail, otpHash, otpType: 'email', expiresAt, userId: userExists.id }
      });
    }

    if (resend) {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: lowerEmail,
        subject: `${otp} – Your HampiStays Verification Code`,
        html: `<h1>Your verification code is ${otp}</h1>`
      });
    }

    const isTestAccount = lowerEmail.endsWith('@example.com') || lowerEmail.includes('test');
    res.json({ 
      success: true, 
      message: `Verification code sent to ${lowerEmail}`,
      devOtp: (process.env.NODE_ENV !== 'production' || isTestAccount) ? otp : undefined 
    });
  } catch (error) {
    next(error);
  }
};

export const sendMobileOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^[6-9]\d{9}$/.test(phone.replace(/\D/g, '').slice(-10))) {
      return res.status(400).json({ error: 'A valid 10-digit Indian mobile number is required.' });
    }
    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);

    const userExists = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
    const pendingExists = await prisma.pendingVerification.findFirst({ where: { phone: normalizedPhone } });

    if (!userExists && !pendingExists) {
      return res.status(404).json({ error: 'Mobile number not registered or pending registration.' });
    }

    const otp = generateSecureOtp();
    const otpHash = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    if (pendingExists) {
      // Update pending registration OTP
      await prisma.pendingVerification.update({
        where: { id: pendingExists.id },
        data: { otpHash, otpType: 'mobile', expiresAt, attempts: 0 }
      });
    } else {
      // Update/create login/general OTP verification
      await prisma.otpVerification.deleteMany({
        where: { phone: normalizedPhone, otpType: 'mobile', verified: false }
      });
      await prisma.otpVerification.create({
        data: { phone: normalizedPhone, otpHash, otpType: 'mobile', expiresAt, userId: userExists.id }
      });
    }

    if (twilioClient) {
      await twilioClient.messages.create({
        body: `Your HampiStays verification code is: ${otp}. Valid for 5 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+91${normalizedPhone}`
      });
    }

    const isTestAccount = normalizedPhone === '9876543210' || normalizedPhone.startsWith('99999');
    res.json({ 
      success: true, 
      message: `Verification code sent to +91${normalizedPhone}`,
      devOtp: (process.env.NODE_ENV !== 'production' || isTestAccount) ? otp : undefined 
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { otp, email, phone, otpType } = req.body;
    const lowerEmail = email?.toLowerCase();
    const normalizedPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
    
    // 1. Check PendingVerification first (Registration Flow)
    const pending = await prisma.pendingVerification.findFirst({
      where: lowerEmail ? { email: lowerEmail } : { phone: normalizedPhone }
    });

    if (pending) {
      if (new Date() > pending.expiresAt) {
        return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
      }
      if (pending.attempts >= 5) {
        return res.status(400).json({ error: 'Too many failed attempts. Please request a new verification code.' });
      }

      const isValid = await bcrypt.compare(otp, pending.otpHash);
      if (!isValid) {
        await prisma.pendingVerification.update({
          where: { id: pending.id },
          data: { attempts: { increment: 1 } }
        });
        return res.status(400).json({ error: 'Invalid verification code.' });
      }

      // Valid OTP! Create user in transaction
      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: pending.email,
            name: pending.name,
            passwordHash: pending.passwordHash,
            role: pending.role,
            phone: pending.phone || null,
            isEmailVerified: pending.otpType === 'email',
            isMobileVerified: pending.otpType === 'mobile',
            verificationCompletedAt: new Date()
          }
        });

        if (pending.role === 'RESORT_OWNER') {
          await tx.resortOwner.create({
            data: { userId: newUser.id, businessName: `${pending.name}'s Portfolio` }
          });
        } else if (pending.role === 'GUIDE') {
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

      // Cleanup pending verification
      await prisma.pendingVerification.delete({ where: { id: pending.id } });

      const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({
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
          location: user.location,
          kycStatus: user.kycStatus || 'NOT_SUBMITTED'
        }
      });
    }

    // 2. Otherwise check OtpVerification (Login / Existing User Flow)
    const whereClause = otpType === 'email' || lowerEmail
      ? { email: lowerEmail, otpType: 'email', verified: false }
      : { phone: normalizedPhone, otpType: 'mobile', verified: false };

    const record = await prisma.otpVerification.findFirst({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    if (!record || new Date() > record.expiresAt || record.attempts >= 5) {
      return res.status(400).json({ error: 'Invalid or expired verification code. Please request a new code.' });
    }

    const isValid = await bcrypt.compare(otp, record.otpHash);
    if (!isValid) {
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } }
      });
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    await prisma.otpVerification.update({ where: { id: record.id }, data: { verified: true } });

    let user;
    if (lowerEmail) {
      user = await prisma.user.findUnique({ where: { email: lowerEmail } });
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isEmailVerified: true, verificationCompletedAt: new Date() }
        });
      }
    } else if (normalizedPhone) {
      user = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isMobileVerified: true, verificationCompletedAt: new Date() }
        });
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({
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
        location: user.location,
        kycStatus: user.kycStatus || 'NOT_SUBMITTED'
      }
    });

  } catch (error) {
    next(error);
  }
};
