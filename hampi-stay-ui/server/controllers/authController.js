import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import crypto from 'crypto';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'hampi_luxury_secret_key_2026';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || '';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export const register = async (req, res, next) => {
  try {
    const { password, name, role, email: rawEmail } = req.body;
    const email = rawEmail.toLowerCase();
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // High salt rounds for better protection
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: role || 'TRAVELLER',
          kycStatus: 'NOT_SUBMITTED'
        },
      });

      if (role === 'RESORT_OWNER') {
        await tx.resortOwner.create({
          data: {
            userId: newUser.id,
            businessName: `${name}'s Portfolio`,
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

    const token = jwt.sign({ userId: result.id, role: result.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: result.id, name: result.name, email: result.email, role: result.role }
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
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
        kycStatus: user.kycStatus || 'NOT_SUBMITTED',
        idType: user.idType,
        idNumber: user.idNumber,
        idImage: user.idImage
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
        kycStatus: user.kycStatus || 'NOT_SUBMITTED',
        idType: user.idType,
        idNumber: user.idNumber,
        idImage: user.idImage
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
        kycStatus: user.kycStatus || 'NOT_SUBMITTED',
        idType: user.idType,
        idNumber: user.idNumber,
        idImage: user.idImage
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
        kycStatus: user.kycStatus || 'NOT_SUBMITTED',
        idType: user.idType,
        idNumber: user.idNumber,
        idImage: user.idImage
      }
    });
  } catch (error) {
    next(error);
  }
};
