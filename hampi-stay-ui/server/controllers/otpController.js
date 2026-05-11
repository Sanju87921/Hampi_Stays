import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
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
    const { email, userId } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    await prisma.otpVerification.deleteMany({
      where: { email, otpType: 'email', verified: false }
    });

    const otp = generateSecureOtp();
    const otpHash = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;

    await prisma.otpVerification.create({
      data: { userId: userId || null, email, otpHash, otpType: 'email', expiresAt }
    });

    if (resend) {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: `${otp} – Your HampiStays Verification Code`,
        html: `<h1>Your verification code is ${otp}</h1>` // Placeholder, we can reuse the fancy HTML later
      });
    }

    res.json({ 
      success: true, 
      message: `Verification code sent to ${email}`,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined 
    });
  } catch (error) {
    next(error);
  }
};

export const sendMobileOtp = async (req, res, next) => {
  try {
    const { phone, userId } = req.body;
    if (!phone || !/^[6-9]\d{9}$/.test(phone.replace(/\D/g, '').slice(-10))) {
      return res.status(400).json({ error: 'A valid 10-digit Indian mobile number is required.' });
    }
    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);

    await prisma.otpVerification.deleteMany({
      where: { phone: normalizedPhone, otpType: 'mobile', verified: false }
    });

    const otp = generateSecureOtp();
    const otpHash = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otpVerification.create({
      data: { userId: userId || null, phone: normalizedPhone, otpHash, otpType: 'mobile', expiresAt }
    });

    if (twilioClient) {
      await twilioClient.messages.create({
        body: `Your HampiStays verification code is: ${otp}. Valid for 5 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+91${normalizedPhone}`
      });
    }

    res.json({ 
      success: true, 
      message: `Verification code sent to +91${normalizedPhone}`,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined 
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { otp, email, phone, otpType, userId } = req.body;
    
    const whereClause = otpType === 'email'
      ? { email, otpType: 'email', verified: false }
      : { phone: phone?.replace(/\D/g, '').slice(-10), otpType: 'mobile', verified: false };

    const record = await prisma.otpVerification.findFirst({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    if (!record || new Date() > record.expiresAt || record.attempts >= 5) {
      return res.status(400).json({ error: 'Invalid or expired OTP. Please request a new code.' });
    }

    const isValid = await bcrypt.compare(otp, record.otpHash);
    if (!isValid) {
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } }
      });
      return res.status(400).json({ error: 'Invalid code.' });
    }

    await prisma.otpVerification.update({ where: { id: record.id }, data: { verified: true } });

    const targetUserId = userId || record.userId;
    if (targetUserId) {
      const updateData = otpType === 'email' ? { isEmailVerified: true } : { isMobileVerified: true };
      await prisma.user.update({ where: { id: targetUserId }, data: updateData });
    }

    res.json({ success: true, verified: true });
  } catch (error) {
    next(error);
  }
};
