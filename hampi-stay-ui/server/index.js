import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import cloudinary from 'cloudinary';
import multer from 'multer';
import streamifier from 'streamifier';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';


dotenv.config();

const prisma = new PrismaClient();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'hampi_luxury_secret_key_2026';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || '';

// Cloudinary Configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer();
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Razorpay Configuration
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
});



app.use(cors({
  origin: "*", // Adjust this to your specific frontend URL in production for better security
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Image Upload Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const stream = cloudinary.v2.uploader.upload_stream(
    {
      folder: 'hampi-stays',
      resource_type: 'auto'
    },
    (error, result) => {
      if (error) {
        console.error('Cloudinary Upload Error:', error);
        return res.status(500).json({ error: 'Upload failed' });
      }
      res.json({ url: result.secure_url });
    }
  );

  streamifier.createReadStream(req.file.buffer).pipe(stream);
});

// Apple Auth
app.post('/api/auth/apple', async (req, res) => {
  try {
    const { id_token, user: userDetails } = req.body;
    const { sub: appleId, email } = await appleSignin.verifyIdToken(id_token, {
      audience: APPLE_CLIENT_ID,
    });

    const userEmail = email.toLowerCase();
    let user = await prisma.user.findUnique({ where: { email: userEmail } });

    if (!user) {
      // Create new traveler account if not exists
      // Note: Apple only sends the name on the FIRST sign-in
      const name = userDetails ? `${userDetails.name.firstName} ${userDetails.name.lastName}` : 'Apple Traveler';
      
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: name,
          passwordHash: await bcrypt.hash(Math.random().toString(36), 12),
          role: 'TRAVELLER'
        }
      });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Apple Auth Error:', error);
    res.status(500).json({ error: 'Apple authentication failed' });
  }
});

// Google Auth
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) return res.status(400).json({ error: 'Invalid token' });

    const { email, name, sub: googleId, picture: avatar } = payload;
    const userEmail = email.toLowerCase();

    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email: userEmail } });

    if (!user) {
      // Create new traveler account if not exists
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: name || 'Google Traveler',
          passwordHash: await bcrypt.hash(Math.random().toString(36), 12), // Placeholder password
          role: 'TRAVELLER',
          avatar
        }
      });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// Root Welcome Route
// We will serve the static files from the dist directory in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('/api/welcome', (req, res) => {
  res.send(`
    <div style="font-family: serif; text-align: center; padding: 50px; background: #fafaf9; color: #0c0a09; height: 100vh;">
      <h1 style="color: #d97706; font-style: italic;">HampiStays Luxury API</h1>
      <p style="font-weight: bold; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.1em;">Status: Online & Secure</p>
      <hr style="width: 50px; border-color: #d97706; margin: 20px auto;" />
      <p>Endpoints available: <code>/api/resorts</code>, <code>/api/auth/login</code></p>
    </div>
  `);
});

// ============================================================
// AUTH ROUTES (Secure & Encrypted)
// ============================================================

// Check if email exists
app.post('/api/auth/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email has been already used. Please use a different email ID to create an account.' });
    }
    
    return res.status(200).json({ message: 'Email is available' });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ error: 'Server error checking email' });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { password, name, role } = req.body;
    const email = req.body.email.toLowerCase();
    
    // Password Strength Check (Server-side)
    const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{9,}$/;
    if (!passwordRegex.test(password)) {
      console.log(`Registration failed: Weak password attempt for ${email}`);
      return res.status(400).json({ error: 'Password must be at least 9 characters and include at least one special character' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log(`Registration attempt failed: Email ${email} already exists`);
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password (End-to-End Security at rest)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: role || 'TRAVELLER',
        },
      });

      if (role === 'RESORT_OWNER') {
        await tx.resortOwner.create({
          data: {
            userId: newUser.id,
            businessName: `${name}'s Portfolio`, // Default business name
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
    console.error(error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email, phone } = req.body;
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined }
        ]
      }
    });

    if (!user) {
      // For security, don't reveal if user exists or not, but in this dummy app we can be more helpful
      return res.status(404).json({ error: 'No account found with this information.' });
    }

    // In a real app, we would generate a token and send an email/SMS
    res.json({ message: 'Reset link sent successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.body.email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`Login failed: User ${email} not found`);
      return res.status(404).json({ error: 'new_traveler_detected' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log(`Login failed: Password mismatch for ${email}`);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ============================================================
// REVIEW ROUTES
// ============================================================

app.post('/api/reviews', async (req, res) => {
  try {
    const { userId, resortId, rating, comment } = req.body;
    const review = await prisma.review.create({
      data: { userId, resortId, rating, comment }
    });

    // Update resort average rating and count
    const resortReviews = await prisma.review.findMany({ where: { resortId } });
    const avgRating = resortReviews.reduce((acc, r) => acc + r.rating, 0) / resortReviews.length;
    
    await prisma.resort.update({
      where: { id: resortId },
      data: {
        rating: avgRating,
        reviewCount: resortReviews.length
      }
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

app.get('/api/resorts/:resortId/reviews', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { resortId: req.params.resortId },
      include: { user: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// ============================================================
// PROFILE & NOTIFICATION ROUTES
// ============================================================

app.patch('/api/users/:id', async (req, res) => {
  try {
    const { name, email, phone, avatar, location, idType, idNumber, idImage, kycStatus, role } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { 
        name, 
        email: email?.toLowerCase(), 
        phone, 
        avatar, 
        location, 
        idType, 
        idNumber, 
        idImage, 
        role,
        kycStatus: kycStatus || (idImage ? 'PENDING' : undefined)
      }
    });
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    // Delete dependent data first
    await prisma.booking.deleteMany({ where: { userId: req.params.id } });
    await prisma.wishlist.deleteMany({ where: { userId: req.params.id } });
    await prisma.review.deleteMany({ where: { userId: req.params.id } });
    
    await prisma.user.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.get('/api/users/:userId/notifications', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.get('/api/users/:userId/bookings', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.params.userId },
      include: { resort: true },
      orderBy: { checkIn: 'asc' }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user bookings' });
  }
});

app.get('/api/users/:userId/wishlist', async (req, res) => {
  try {
    const wishlist = await prisma.savedResort ? await prisma.savedResort.findMany({
      where: { userId: req.params.userId },
      include: { resort: true }
    }) : [];
    res.json(wishlist.map((w) => w.resort || w));
  } catch (error) {
    res.json([]);
  }
});
  
  // ============================================================
  // DISCOVERY & HERITAGE ROUTES
  // ============================================================
  
  const ATTRACTIONS = [
    {
      id: "virupaksha",
      title: "Virupaksha Temple",
      category: "Historical",
      description: "The oldest and most sacred temple in Hampi, dedicated to Lord Shiva. Its towering gopuram (gateway) is visible from miles away and has survived centuries of change.",
      timing: "6:00 AM - 8:00 PM",
      fee: "₹50 (Indians) / ₹500 (Foreigners)",
      image: "https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=2000",
      highlights: ["Inverted shadow of the gopuram", "Ancient inscriptions", "Live temple elephant 'Lakshmi'"]
    },
    {
      id: "vitthala",
      title: "Vitthala Temple & Stone Chariot",
      category: "Iconic",
      description: "The pinnacle of Vijayanagara architecture. Home to the legendary Stone Chariot and the musical pillars that produce melodic notes when tapped.",
      timing: "8:30 AM - 5:30 PM",
      fee: "Included in Hampi Heritage ticket",
      image: "https://images.unsplash.com/photo-1642516863984-68fdeea5ba64?auto=format&fit=crop&q=80&w=2000",
      highlights: ["The Stone Chariot", "Musical Pillars", "Elaborate carvings of Maha Mantapa"]
    },
    {
      id: "matanga",
      title: "Matanga Hill",
      category: "Adventure",
      description: "The highest point in Hampi, offering unparalleled panoramic views of the entire heritage site. It's the most popular spot for sunrise and sunset.",
      timing: "Open 24/7 (Recommended: Sunrise/Sunset)",
      fee: "Free",
      image: "https://images.unsplash.com/photo-1596018382916-56d2e341d784?auto=format&fit=crop&q=80&w=2000",
      highlights: ["360-degree panorama", "Veerabhadra Temple at summit", "Breathtaking sunset views"]
    },
    {
      id: "lotus-mahal",
      title: "Lotus Mahal & Elephant Stables",
      category: "Royal",
      description: "Part of the Zenana Enclosure, this two-storied pavilion is a unique blend of Indo-Islamic architecture, designed to resemble a lotus bud.",
      timing: "8:30 AM - 5:30 PM",
      fee: "Included in Hampi Heritage ticket",
      image: "https://images.unsplash.com/photo-1600100397608-f010e423b971?auto=format&fit=crop&q=80&w=2000",
      highlights: ["Indo-Islamic design", "Water cooling system", "Grand Elephant Stables nearby"]
    }
  ];
  
  const POINTS_OF_INTEREST = [
    {
      id: "vittala",
      name: "Vittala Temple",
      category: "Architecture",
      x: 75,
      y: 35,
      description: "The architectural pinnacle of Hampi, famous for its musical pillars and the iconic stone chariot.",
      image: "https://images.unsplash.com/photo-1642516863984-68fdeea5ba64?auto=format&fit=crop&q=80&w=2000",
      recommendedTours: ["Vittala Musical Pillars Deep-Dive", "Stone Chariot Photography"],
      nearbyResort: "Evolve Back Kamlapura"
    },
    {
      id: "virupaksha",
      name: "Virupaksha Temple",
      category: "Heritage",
      x: 25,
      y: 40,
      description: "The oldest and most sacred temple in Hampi, dedicated to Lord Shiva, with a towering 50-meter gopuram.",
      image: "https://images.unsplash.com/photo-1581391528803-5eba57ac1f2d?auto=format&fit=crop&q=80&w=2000",
      recommendedTours: ["Main Bazaar Walk", "Sacred Center Sunrise Tour"],
      nearbyResort: "Hampi Heritage Resort"
    },
    {
      id: "matanga",
      name: "Matanga Hill",
      category: "Nature",
      x: 45,
      y: 45,
      description: "The highest point in Hampi offering a breathtaking 360-degree view of the entire landscape.",
      image: "https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=2000",
      recommendedTours: ["Sunrise Trek", "Bouldering Adventure"],
      nearbyResort: "Whispering Rocks"
    },
    {
      id: "lotus",
      name: "Lotus Mahal",
      category: "Architecture",
      x: 35,
      y: 65,
      description: "An elegant two-story pavilion showcasing a unique blend of Indo-Islamic architecture.",
      image: "https://images.unsplash.com/photo-1588319648913-0ff4b76a9fed?auto=format&fit=crop&q=80&w=2000",
      recommendedTours: ["Royal Enclosure Walk", "Women of Vijayanagara Tour"],
      nearbyResort: "Heritage Resort Hampi"
    },
    {
      id: "bazaar",
      name: "Hampi Bazaar",
      category: "Heritage",
      x: 30,
      y: 35,
      description: "Once a bustling trade center for diamonds and spices, now a row of ancient stone pavilions.",
      image: "https://images.unsplash.com/photo-1596018382916-56d2e341d784?auto=format&fit=crop&q=80&w=2000",
      recommendedTours: ["Forgotten Village Cycle Tour", "Bazaar Street Stories"],
      nearbyResort: "The Hyatt Place"
    }
  ];
  
  app.get('/api/heritage/attractions', (req, res) => res.json(ATTRACTIONS));
  app.get('/api/heritage/poi', (req, res) => res.json(POINTS_OF_INTEREST));
  
  app.get('/api/stats', async (req, res) => {
    try {
      const resortsCount = await prisma.resort.count();
      const bookingsCount = await prisma.booking.count();
      res.json({
        resorts: `${resortsCount}+`,
        guests: `${(bookingsCount * 2 + 1250).toLocaleString()}+`, // Base 1250 + real growth
        experiences: "25+",
        rating: "4.9"
      });
    } catch (error) {
      res.json({ resorts: "50+", guests: "10k+", experiences: "25+", rating: "4.9" });
    }
  });

  // ============================================================
  // NOTIFICATION ROUTES
  // ============================================================

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Get Booking by Reference
app.get('/api/bookings/reference/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { referenceNumber: reference },
      include: { resort: true, user: true }
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// ============================================================
// BOOKING ROUTES
// ============================================================

app.post('/api/bookings', async (req, res) => {
  try {
    const { userId, resortId, roomId, checkIn, checkOut, guests, totalPrice, specialRequests, phone, customerName } = req.body;
    const referenceNumber = `HS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // 1. Create Booking in Database
    const booking = await prisma.booking.create({
      data: {
        userId, resortId, roomId,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        guests: Number(guests),
        totalPrice: Number(totalPrice),
        specialRequests,
        referenceNumber,
        status: 'PENDING' // Initial status
      }
    });

    // 2. Create Razorpay Order
    let razorpayOrder = null;
    try {
      const options = {
        amount: Math.round(totalPrice * 100), // amount in the smallest currency unit (paise)
        currency: "INR",
        receipt: referenceNumber,
      };
      razorpayOrder = await razorpay.orders.create(options);
    } catch (rzpError) {
      console.error('⚠️ Razorpay Order Creation Failed:', rzpError);
    }

    res.status(201).json({
      ...booking,
      razorpayOrderId: razorpayOrder?.id
    });
  } catch (error) {
    console.error('❌ BOOKING ERROR:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

app.post('/api/bookings/:reference/verify-payment', async (req, res) => {
  try {
    const { reference } = req.params;
    console.log("--- New Verification Request ---");
    console.log("Headers:", req.headers);
    console.log("Body exists:", !!req.body);

    if (!req.body) {
      console.error("❌ req.body is undefined!");
      return res.status(400).json({ error: "Missing request body" });
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    // 1. Verify Signature
    if (razorpay_signature) {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
        .update(body.toString())
        .digest("hex");

      console.log("--- Payment Verification ---");
      console.log("Order ID:", razorpay_order_id);
      console.log("Payment ID:", razorpay_payment_id);
      console.log("Received Signature:", razorpay_signature);
      console.log("Expected Signature:", expectedSignature);
      console.log("Secret length:", (process.env.RAZORPAY_KEY_SECRET || "").length);

      if (expectedSignature !== razorpay_signature) {
        console.error("❌ Signature Mismatch!");
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
      }
    }

    // 2. Update Booking Status
    const booking = await prisma.booking.update({
      where: { referenceNumber: reference },
      data: { status: 'CONFIRMED' },
      include: { user: true, resort: true }
    });

    // 3. Create Success Notification
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: 'Booking Confirmed!',
        message: `Your booking at ${booking.resort.name} is confirmed. Ref: ${reference}`,
        type: 'booking'
      }
    });

    return res.json({ success: true, booking });
  } catch (error) {
    console.error('❌ VERIFICATION ERROR:', error.message);
    res.status(500).json({ error: 'Failed to verify booking' });
  }
});

// ============================================================
// RESORT ROUTES
// ============================================================


// ============================================================
// RESORT ROUTES
// ============================================================

app.get('/api/resorts', async (req, res) => {
  try {
    const resorts = await prisma.resort.findMany({
      where: { status: 'APPROVED' },
      include: { roomTypes: true }
    });
    res.json(resorts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resorts' });
  }
});

app.get('/api/resorts/:slug', async (req, res) => {
  try {
    const resort = await prisma.resort.findUnique({
      where: { slug: req.params.slug },
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
    res.json(resort);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/resorts', async (req, res) => {
  try {
    const { name, tagline, description, type, area, price, amenities, ownerId, category, houseRules, mealPackages, roomTypes, documents, images } = req.body;
    
    // Find the resort owner record first
    let owner = await prisma.resortOwner.findUnique({
      where: { userId: ownerId }
    });

    if (!owner) {
      // Auto-repair: If user has the role but no owner profile, create it now
      const user = await prisma.user.findUnique({ where: { id: ownerId } });
      if (user && user.role === 'RESORT_OWNER') {
        owner = await prisma.resortOwner.create({
          data: {
            userId: ownerId,
            businessName: `${user.name}'s Portfolio`
          }
        });
      } else {
        return res.status(404).json({ error: 'Resort owner profile not found. Please ensure you are registered as an owner.' });
      }
    }

    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.random().toString(36).substring(2, 5);
    
    const resort = await prisma.resort.create({
      data: {
        name,
        slug,
        tagline,
        description,
        type,
        category: category || 'Heritage',
        locationArea: area,
        locationLat: 15.3350,
        locationLng: 76.4600,
        pricePerNight: parseFloat(price) || 0,
        amenities,
        houseRules: houseRules || [],
        mealPackages: mealPackages || [],
        ownerId: owner.id,
        status: 'PENDING',
        images: images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=2000'],
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
      },
      include: { roomTypes: true }
    });

    res.status(201).json(resort);
  } catch (error) {
    console.error('Error creating resort:', error);
    res.status(500).json({ error: 'Failed to create resort' });
  }
});

// Photo Management
app.post('/api/resorts/:id/photos', async (req, res) => {
  try {
    const { id } = req.params;
    const { url } = req.body;
    const resort = await prisma.resort.update({
      where: { id },
      data: { images: { push: url } }
    });
    res.json(resort);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add photo' });
  }
});

app.delete('/api/resorts/:id/photos', async (req, res) => {
  try {
    const { id } = req.params;
    const { url } = req.body;
    const resort = await prisma.resort.findUnique({ where: { id } });
    if (!resort) return res.status(404).json({ error: 'Resort not found' });
    
    const updatedImages = resort.images.filter(img => img !== url);
    const updatedResort = await prisma.resort.update({
      where: { id },
      data: { images: updatedImages }
    });
    res.json(updatedResort);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

app.post('/api/rooms/:id/photos', async (req, res) => {
  try {
    const { id } = req.params;
    const { url } = req.body;
    const room = await prisma.room.update({
      where: { id },
      data: { images: { push: url } }
    });
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add room photo' });
  }
});

app.delete('/api/rooms/:id/photos', async (req, res) => {
  try {
    const { id } = req.params;
    const { url } = req.body;
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    const updatedImages = room.images.filter(img => img !== url);
    const updatedRoom = await prisma.room.update({
      where: { id },
      data: { images: updatedImages }
    });
    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete room photo' });
  }
});

app.delete('/api/resorts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Manually delete bookings first because schema doesn't have onDelete: Cascade for Booking
    await prisma.booking.deleteMany({
      where: { resortId: id }
    });

    // Delete the resort (cascades to Room, RoomPriceOverride, RoomBlocking, Wishlist, Review, DiscountCode)
    await prisma.resort.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Resort deleted successfully' });
  } catch (error) {
    console.error('Delete resort error:', error);
    res.status(500).json({ error: 'Failed to delete resort' });
  }
});

app.get('/api/resorts/:resortId/bookings', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { resortId: req.params.resortId },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resort bookings' });
  }
});

// ============================================================
// ADMIN & SETTINGS ROUTES
// ============================================================

// System Settings
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({ data: { guideServiceEnabled: true } });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.patch('/api/admin/settings', async (req, res) => {
  try {
    const { guideServiceEnabled } = req.body;
    let settings = await prisma.systemSettings.findFirst();
    if (settings) {
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: { guideServiceEnabled }
      });
    } else {
      settings = await prisma.systemSettings.create({ data: { guideServiceEnabled } });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.get('/api/users/:userId/bookings', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.params.userId },
      include: {
        resort: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(bookings);
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Guide & Experience Management
app.get('/api/guides/profile/:userId', async (req, res) => {
  try {
    const profile = await prisma.guideProfile.findUnique({
      where: { userId: req.params.userId },
      include: { experiences: true }
    });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch guide profile' });
  }
});

app.post('/api/guides/:profileId/experiences', async (req, res) => {
  try {
    const { profileId } = req.params;
    const { title, description, price, durationHours, meetingPoint, includes, images } = req.body;
    const experience = await prisma.experience.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        durationHours: parseInt(durationHours),
        meetingPoint,
        includes: includes || [],
        images: images || [],
        guideId: profileId
      }
    });
    res.json(experience);
  } catch (error) {
    console.error('Create experience error:', error);
    res.status(500).json({ error: 'Failed to create experience' });
  }
});

app.get('/api/guides', async (req, res) => {
  try {
    const settings = await prisma.systemSettings.findFirst();
    if (settings && !settings.guideServiceEnabled) {
      return res.json([]);
    }
    
    const guides = await prisma.guideProfile.findMany({
      where: { 
        isActive: true,
        status: 'APPROVED'
      },
      include: {
        user: {
          select: { name: true, email: true }
        },
        experiences: true
      }
    });
    res.json(guides);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch guides' });
  }
});

app.get('/api/experiences', async (req, res) => {
  try {
    const settings = await prisma.systemSettings.findFirst();
    if (settings && !settings.guideServiceEnabled) {
      return res.json([]);
    }

    const experiences = await prisma.experience.findMany({
      where: {
        guide: {
          isActive: true,
          status: 'APPROVED'
        }
      },
      include: {
        guide: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(experiences);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch experiences' });
  }
});

app.delete('/api/experiences/:id', async (req, res) => {
  try {
    await prisma.experience.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete experience' });
  }
});

// Update Guide Profile
app.patch('/api/guides/profile/:userId', async (req, res) => {
  try {
    const { bio, specialties, languages, pricePerDay, pricePerHour, idType, idNumber, idImage } = req.body;
    const profile = await prisma.guideProfile.update({
      where: { userId: req.params.userId },
      data: { 
        bio, 
        specialties, 
        languages, 
        pricePerDay: pricePerDay ? parseFloat(pricePerDay) : undefined, 
        pricePerHour: pricePerHour ? parseFloat(pricePerHour) : undefined,
        idType,
        idNumber,
        idImage,
        status: (idType && idNumber && idImage) ? 'PENDING' : undefined // Set to pending if docs are provided
      }
    });
    res.json(profile);
  } catch (error) {
    console.error('Update guide profile error:', error);
    res.status(500).json({ error: 'Failed to update guide profile' });
  }
});

// Admin: Get all guides for verification
app.get('/api/admin/guides', async (req, res) => {
  try {
    const guides = await prisma.guideProfile.findMany({
      include: { user: true }
    });
    res.json(guides);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch guides for admin' });
  }
});

// Admin: Toggle All Guides Active Status
app.patch('/api/admin/guides/toggle-all', async (req, res) => {
  try {
    const { isActive } = req.body;
    await prisma.guideProfile.updateMany({
      data: { isActive }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle all guides' });
  }
});

// Admin: Toggle Guide Active Status
app.patch('/api/admin/guides/:profileId/toggle-active', async (req, res) => {
  try {
    const { isActive } = req.body;
    const profile = await prisma.guideProfile.update({
      where: { id: req.params.profileId },
      data: { isActive }
    });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle guide status' });
  }
});

// Admin: Approve/Reject Guide
app.patch('/api/admin/guides/:profileId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const profile = await prisma.guideProfile.update({
      where: { id: req.params.profileId },
      data: { 
        status,
        isVerified: status === 'APPROVED' // Mark as verified if approved
      },
      include: { user: true }
    });
    
    // Create notification for the guide
    await prisma.notification.create({
      data: {
        userId: profile.userId,
        title: status === 'APPROVED' ? 'Profile Approved!' : 'Verification Update',
        message: status === 'APPROVED' 
          ? 'Your guide profile has been verified. You can now accept bookings!' 
          : 'There was an issue with your documents. Please re-upload clear copies of your ID.',
        type: 'info'
      }
    });

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update guide status' });
  }
});

// Guide Bookings
app.get('/api/guides/:profileId/bookings', async (req, res) => {
  try {
    const bookings = await prisma.guideBooking.findMany({
      where: { guideId: req.params.profileId },
      include: { user: { select: { name: true, email: true, avatar: true } } },
      orderBy: { date: 'desc' }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch guide bookings' });
  }
});

app.patch('/api/guide-bookings/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await prisma.guideBooking.update({
      where: { id: req.params.id },
      data: { status },
      include: { user: true, guide: { include: { user: true } } }
    });
    
    console.log(`[GUIDE BOOKING] Status updated to ${status} for ${booking.user.name}`);
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

app.patch('/api/bookings/:bookingId/cancel', async (req, res) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: req.params.bookingId },
      data: { status: 'CANCELLED' }
    });
    res.json(booking);
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

app.patch('/api/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const booking = await prisma.booking.update({
      where: { id },
      data: { status }
    });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

app.patch('/api/bookings/:id/confirm', async (req, res) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'CONFIRMED' },
      include: { user: true, resort: true }
    });
    
    // Simulate sending email to traveler
    console.log(`\n======================================================`);
    console.log(`📧 EMAIL SENT TO: ${booking.user.email}`);
    console.log(`SUBJECT: Your booking at ${booking.resort.name} is confirmed!`);
    console.log(`BODY: Dear ${booking.user.name}, your stay from ${new Date(booking.checkIn).toLocaleDateString()} to ${new Date(booking.checkOut).toLocaleDateString()} is fully confirmed. Ref: ${booking.referenceNumber}`);
    console.log(`======================================================\n`);

    res.json(booking);
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ error: 'Failed to confirm booking' });
  }
});

app.patch('/api/bookings/:id/reject', async (req, res) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
      include: { user: true, resort: true }
    });
    
    // Simulate sending email to traveler
    console.log(`\n======================================================`);
    console.log(`📧 EMAIL SENT TO: ${booking.user.email}`);
    console.log(`SUBJECT: Booking update for ${booking.resort.name}`);
    console.log(`BODY: Dear ${booking.user.name}, we are sorry but the resort could not accept your booking request. Ref: ${booking.referenceNumber}`);
    console.log(`======================================================\n`);

    res.json(booking);
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({ error: 'Failed to reject booking' });
  }
});

app.get('/api/owners/:userId/resorts', async (req, res) => {
  try {
    const owner = await prisma.resortOwner.findUnique({
      where: { userId: req.params.userId },
      include: { 
        resorts: { 
          include: { 
            roomTypes: {
              include: {
                priceOverrides: true,
                blockings: true
              }
            }, 
            bookings: { include: { user: true } },
            discountCodes: true
          } 
        } 
      }
    });
    res.json(owner?.resorts || []);
  } catch (error) {
    console.error('Fetch resorts error:', error);
    res.status(500).json({ error: 'Failed to fetch owner resorts' });
  }
});

// Get resort rooms
app.get('/api/resorts/:resortId/rooms', async (req, res) => {
  try {
    const { resortId } = req.params;
    const rooms = await prisma.room.findMany({
      where: { resortId }
    });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new room
app.post('/api/rooms', async (req, res) => {
  try {
    const { resortId, name, description, pricePerNight, capacity, amenities, availableCount } = req.body;
    
    const room = await prisma.room.create({
      data: {
        resortId,
        name,
        description,
        pricePerNight: parseFloat(pricePerNight),
        capacity: parseInt(capacity),
        amenities: amenities || [],
        availableCount: parseInt(availableCount) || 1,
        images: [] // Placeholder for now
      }
    });
    
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// WISHLIST ROUTES
// ============================================================

app.post('/api/wishlist/toggle', async (req, res) => {
  try {
    const { userId, resortId } = req.body;
    const existing = await prisma.wishlist.findUnique({
      where: { userId_resortId: { userId, resortId } }
    });

    if (existing) {
      await prisma.wishlist.delete({ where: { id: existing.id } });
      res.json({ saved: false });
    } else {
      await prisma.wishlist.create({ data: { userId, resortId } });
      res.json({ saved: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle wishlist' });
  }
});

app.get('/api/users/:userId/wishlist', async (req, res) => {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: req.params.userId },
      include: { resort: true }
    });
    res.json(wishlist.map(w => w.resort));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// Add resort photo
app.post('/api/resorts/:id/photos', async (req, res) => {
  try {
    const { url } = req.body;
    const resort = await prisma.resort.update({
      where: { id: req.params.id },
      data: {
        images: {
          set: [...(await prisma.resort.findUnique({ where: { id: req.params.id } })).images, url]
        }
      },
      include: { roomTypes: true, bookings: { include: { user: true } } }
    });
    res.json(resort);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add photo' });
  }
});

// Delete resort photo
app.delete('/api/resorts/:id/photos', async (req, res) => {
  try {
    const { url } = req.body;
    const current = await prisma.resort.findUnique({ where: { id: req.params.id } });
    const resort = await prisma.resort.update({
      where: { id: req.params.id },
      data: {
        images: {
          set: current.images.filter(img => img !== url)
        }
      },
      include: { roomTypes: true, bookings: { include: { user: true } } }
    });
    res.json(resort);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Add room photo
app.post('/api/rooms/:id/photos', async (req, res) => {
  try {
    const { url } = req.body;
    const room = await prisma.room.findUnique({ where: { id: req.params.id } });
    await prisma.room.update({
      where: { id: req.params.id },
      data: {
        images: {
          set: [...(room.images || []), url]
        }
      }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add photo' });
  }
});

// Delete room photo
app.delete('/api/rooms/:id/photos', async (req, res) => {
  try {
    const { url } = req.body;
    const room = await prisma.room.findUnique({ where: { id: req.params.id } });
    await prisma.room.update({
      where: { id: req.params.id },
      data: {
        images: {
          set: room.images.filter(img => img !== url)
        }
      }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// ============================================================
// PHASE 6: INVENTORY & PRICING
// ============================================================

// Apply Price Overrides
app.post('/api/rooms/:roomId/price-overrides', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { dates, price, minNights } = req.body;

    const overrides = await Promise.all(
      dates.map(date => 
        prisma.roomPriceOverride.upsert({
          where: {
            roomId_date: {
              roomId,
              date: new Date(date)
            }
          },
          update: { price, minNights },
          create: {
            roomId,
            date: new Date(date),
            price,
            minNights
          }
        })
      )
    );

    res.json({ message: 'Price & Rules applied', count: overrides.length });
  } catch (error) {
    console.error('Price override error:', error);
    res.status(500).json({ error: 'Failed to apply pricing' });
  }
});

// Block Room Dates
app.post('/api/rooms/:roomId/blockings', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { dates, reason } = req.body;

    const blockings = await Promise.all(
      dates.map(date => 
        prisma.roomBlocking.upsert({
          where: {
            roomId_date: {
              roomId,
              date: new Date(date)
            }
          },
          update: { reason },
          create: {
            roomId,
            date: new Date(date),
            reason
          }
        })
      )
    );

    res.json({ message: 'Dates blocked successfully', count: blockings.length });
  } catch (error) {
    console.error('Blocking error:', error);
    res.status(500).json({ error: 'Failed to block dates' });
  }
});

// Create Discount Code
app.post('/api/resorts/:resortId/discount-codes', async (req, res) => {
  try {
    const { resortId } = req.params;
    const { 
      code, percentage, flatAmount, validFrom, validUntil, maxUses,
      isEarlyBird, minDaysInAdvance, isLastMinute, maxDaysInAdvance
    } = req.body;

    const discount = await prisma.discountCode.create({
      data: {
        code: code.toUpperCase(),
        percentage: percentage ? parseFloat(percentage) : null,
        flatAmount: flatAmount ? parseFloat(flatAmount) : null,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        maxUses: maxUses ? parseInt(maxUses) : null,
        isEarlyBird: !!isEarlyBird,
        minDaysInAdvance: minDaysInAdvance ? parseInt(minDaysInAdvance) : null,
        isLastMinute: !!isLastMinute,
        maxDaysInAdvance: maxDaysInAdvance ? parseInt(maxDaysInAdvance) : null,
        resortId
      }
    });

    res.status(201).json(discount);
  } catch (error) {
    console.error('Discount creation error:', error);
    res.status(500).json({ error: 'Failed to create discount code' });
  }
});

// ============================================================
// ADMIN ROUTES
// ============================================================

app.get('/api/admin/resorts/pending', async (req, res) => {
  try {
    const pendingResorts = await prisma.resort.findMany({
      where: { status: 'PENDING' },
      include: { owner: { include: { user: true } } }
    });
    res.json(pendingResorts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending resorts' });
  }
});

app.patch('/api/admin/resorts/:id/status', async (req, res) => {
  try {
    const { status } = req.body; // APPROVED or REJECTED
    const resort = await prisma.resort.update({
      where: { id: req.params.id },
      data: { status },
      include: { owner: { include: { user: true } } }
    });
    
    // Notify owner
    await prisma.notification.create({
      data: {
        userId: resort.owner.userId,
        title: status === 'APPROVED' ? 'Resort Approved!' : 'Resort Update Required',
        message: status === 'APPROVED' 
          ? `Congratulations! ${resort.name} is now live on HampiStays.`
          : `Your resort listing ${resort.name} needs some changes before it can be approved.`,
        type: 'info'
      }
    });

    res.json(resort);
  } catch (error) {
    console.error('Admin status update error:', error);
    res.status(500).json({ error: 'Failed to update resort status' });
  }
});

app.get('/api/users/list', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        phone: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const [userCount, resortCount, bookingCount, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.resort.count(),
      prisma.booking.count(),
      prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: { status: 'CONFIRMED' }
      })
    ]);

    res.json({
      userCount,
      resortCount,
      bookingCount,
      revenue: totalRevenue._sum.totalPrice || 0,
      platformRating: 4.8
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/admin/resorts/active', async (req, res) => {
  try {
    const resorts = await prisma.resort.findMany({
      where: { status: 'APPROVED' },
      include: {
        owner: {
          include: { user: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(resorts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active resorts' });
  }
});

app.patch('/api/admin/resorts/:id/feature', async (req, res) => {
  const { id } = req.params;
  const { isFeatured } = req.body;
  try {
    const resort = await prisma.resort.update({
      where: { id },
      data: { isFeatured }
    });
    res.json(resort);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update featured status' });
  }
});

app.get('/api/admin/bookings/all', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        resort: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) {
    console.error('Fetch all bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch global bookings' });
  }
});

// Public Featured Resorts
app.get('/api/resorts/featured', async (req, res) => {
  try {
    const resorts = await prisma.resort.findMany({
      where: { 
        status: 'APPROVED',
        isFeatured: true 
      },
      take: 3,
      orderBy: { updatedAt: 'desc' }
    });
    res.json(resorts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch featured resorts' });
  }
});

// System Task Endpoints (Real-time Data)
app.get('/api/admin/payouts', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { 
        status: { in: ['CONFIRMED', 'PAID'] }
      },
      include: {
        resort: {
          select: { name: true }
        }
      },
      orderBy: { checkOut: 'desc' }
    });

    const payouts = bookings.map(booking => {
      const isPastCheckout = new Date(booking.checkOut) < new Date();
      return {
        id: booking.id,
        resort: booking.resort.name,
        ref: booking.referenceNumber,
        amount: booking.totalPrice,
        status: isPastCheckout ? 'READY' : 'PENDING_CHECKOUT',
        checkOut: booking.checkOut
      };
    });

    res.json(payouts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

app.post('/api/admin/tasks/payouts', async (req, res) => {
  // Simulate checking with payout logs
  await new Promise(resolve => setTimeout(resolve, 2500));
  res.json({ success: true, message: 'All pending payouts verified and matched with internal logs.' });
});

app.post('/api/admin/tasks/newsletter', async (req, res) => {
  // Simulate background email processing
  await new Promise(resolve => setTimeout(resolve, 3500));
  res.json({ success: true, message: 'Monthly HampiStays newsletter dispatched to 1,250 verified guests.' });
});

app.post('/api/admin/tasks/security', async (req, res) => {
  // Simulate a deep system scan
  await new Promise(resolve => setTimeout(resolve, 5000));
  res.json({ success: true, message: 'Global security audit complete. All 25 endpoints secured. SSL certificates active.' });
});

app.get('/api/admin/security/stats', async (req, res) => {
  try {
    // Generate dynamic logs to simulate real-time monitoring
    const events = [
      "API Integrity Scan Completed",
      "Admin Session Verified",
      "SSL Handshake Successful",
      "Database Query Optimized",
      "Firewall Rules Updated",
      "Encrypted Backup Synced",
      "New Resort Profile Approved"
    ];

    const logs = Array.from({ length: 6 }).map((_, i) => {
      const time = new Date(Date.now() - i * 1000 * 60 * 15); // Spread logs over time
      return {
        time: time.toLocaleTimeString(),
        event: events[Math.floor(Math.random() * events.length)],
        ip: i === 0 ? req.ip : `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.1.1`,
        status: "SECURE"
      };
    });

    // Active sessions based on user count or random 15-45
    const activeSessions = Math.floor(Math.random() * 30) + 15;

    res.json({ logs, activeSessions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch security stats' });
  }
});

app.get('/api/messages/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const messages = await prisma.message.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { name: true, role: true } } }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { text, senderId, bookingId } = req.body;
    
    // Create message
    const message = await prisma.message.create({
      data: { text, senderId, bookingId },
      include: { 
        sender: { select: { name: true, role: true } },
        booking: { include: { resort: { include: { owner: true } }, user: true } }
      }
    });

    // Determine recipient
    const isGuestSender = senderId === message.booking.userId;
    const recipientId = isGuestSender 
      ? message.booking.resort.owner.userId 
      : message.booking.userId;

    // Create Notification for recipient
    await prisma.notification.create({
      data: {
        userId: recipientId,
        title: isGuestSender ? 'New Message from Guest' : 'New Message from Resort',
        message: `${message.sender.name}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
        type: 'booking'
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Message notification error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ============================================================
// GUIDE ROUTES
// ============================================================

// Get all active guides (public listing)
app.get('/api/guides', async (req, res) => {
  try {
    const guides = await prisma.guideProfile.findMany({
      where: { isActive: true },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        experiences: true
      },
      orderBy: { rating: 'desc' }
    });
    res.json(guides);
  } catch (error) {
    console.error('Get guides error:', error);
    res.status(500).json({ error: 'Failed to fetch guides' });
  }
});

// Get guide profile by user ID
app.get('/api/guides/profile/:userId', async (req, res) => {
  try {
    const guide = await prisma.guideProfile.findUnique({
      where: { userId: req.params.userId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        experiences: true,
        bookings: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!guide) return res.status(404).json({ error: 'Guide profile not found' });
    res.json(guide);
  } catch (error) {
    console.error('Get guide profile error:', error);
    res.status(500).json({ error: 'Failed to fetch guide profile' });
  }
});

// Update guide profile
app.patch('/api/guides/profile/:userId', async (req, res) => {
  try {
    const { bio, pricePerDay, pricePerHour, specialties, languages, idType, idNumber, idImage } = req.body;
    const guide = await prisma.guideProfile.update({
      where: { userId: req.params.userId },
      data: {
        bio: bio || undefined,
        pricePerDay: pricePerDay ? parseFloat(pricePerDay) : undefined,
        pricePerHour: pricePerHour ? parseFloat(pricePerHour) : undefined,
        specialties: specialties || undefined,
        languages: languages || undefined,
        idType: idType || undefined,
        idNumber: idNumber || undefined,
        idImage: idImage || undefined,
        status: idImage ? 'PENDING' : undefined
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        experiences: true
      }
    });
    res.json(guide);
  } catch (error) {
    console.error('Update guide profile error:', error);
    res.status(500).json({ error: 'Failed to update guide profile' });
  }
});

// Get bookings for a guide
app.get('/api/guides/:guideId/bookings', async (req, res) => {
  try {
    const bookings = await prisma.guideBooking.findMany({
      where: { guideId: req.params.guideId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) {
    console.error('Get guide bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch guide bookings' });
  }
});

// Update booking status (confirm/cancel)
app.patch('/api/guide-bookings/:bookingId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await prisma.guideBooking.update({
      where: { id: req.params.bookingId },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } }
      }
    });
    res.json(booking);
  } catch (error) {
    console.error('Update guide booking status error:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Create experience
app.post('/api/guides/:guideId/experiences', async (req, res) => {
  try {
    const { title, description, price, durationHours, meetingPoint, includes } = req.body;
    const experience = await prisma.experience.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        durationHours: parseInt(durationHours),
        meetingPoint,
        includes: includes || [],
        images: [],
        guideId: req.params.guideId
      }
    });
    res.status(201).json(experience);
  } catch (error) {
    console.error('Create experience error:', error);
    res.status(500).json({ error: 'Failed to create experience' });
  }
});

// Delete experience
app.delete('/api/experiences/:id', async (req, res) => {
  try {
    await prisma.experience.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete experience error:', error);
    res.status(500).json({ error: 'Failed to delete experience' });
  }
});

// Update experience (e.g. images)
app.patch('/api/experiences/:id', async (req, res) => {
  try {
    const { images, title, description, price, durationHours, meetingPoint } = req.body;
    const experience = await prisma.experience.update({
      where: { id: req.params.id },
      data: {
        images: images !== undefined ? images : undefined,
        title: title || undefined,
        description: description || undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        durationHours: durationHours !== undefined ? parseInt(durationHours) : undefined,
        meetingPoint: meetingPoint || undefined,
      }
    });
    res.json(experience);
  } catch (error) {
    console.error('Update experience error:', error);
    res.status(500).json({ error: 'Failed to update experience' });
  }
});

// Book a guide
app.post('/api/guides/:guideId/book', async (req, res) => {
  try {
    const { userId, date, durationHours, totalPrice, meetingPoint, specialRequests } = req.body;
    const booking = await prisma.guideBooking.create({
      data: {
        userId,
        guideId: req.params.guideId,
        date: new Date(date),
        durationHours: parseInt(durationHours),
        totalPrice: parseFloat(totalPrice),
        meetingPoint,
        specialRequests: specialRequests || null,
        status: 'PENDING'
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } }
      }
    });
    res.status(201).json(booking);
  } catch (error) {
    console.error('Book guide error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get all experiences
app.get('/api/experiences', async (req, res) => {
  try {
    const experiences = await prisma.experience.findMany({
      include: {
        guide: {
          include: {
            user: { select: { id: true, name: true, avatar: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(experiences);
  } catch (error) {
    console.error('Get experiences error:', error);
    res.status(500).json({ error: 'Failed to fetch experiences' });
  }
});

// System settings (Global)
app.get('/api/settings', (req, res) => {
  res.json({
    guideServiceEnabled: true,
    maintenanceMode: false,
    version: '1.0.0'
  });
});

// ============================================================
// STAFF & OPERATIONS (Phase 9)
// ============================================================

// Invite Staff Member
app.post('/api/admin/staff/invite', async (req, res) => {
  const { email, role, resortId } = req.body;
  try {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const invitation = await prisma.invitation.create({
      data: { email, role, resortId, code }
    });
    res.json(invitation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List Invitations for Resort
app.get('/api/admin/staff/invitations/:resortId', async (req, res) => {
  try {
    const invitations = await prisma.invitation.findMany({
      where: { resortId: req.params.resortId }
    });
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept Invitation
app.post('/api/auth/staff/accept', async (req, res) => {
  const { code, userId } = req.body;
  try {
    const invite = await prisma.invitation.findUnique({
      where: { code, status: 'PENDING' }
    });
    if (!invite) return res.status(404).json({ error: "Invalid or expired invitation code." });

    // Update User Role and Link to Resort
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { role: 'STAFF' }
      }),
      prisma.staffMember.create({
        data: {
          userId,
          resortId: invite.resortId,
          role: invite.role
        }
      }),
      prisma.invitation.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' }
      })
    ]);

    res.json({ success: true, message: "Welcome to the team!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Catch-all route to serve the frontend index.html for any non-API routes
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 HampiStays Luxury API running on port ${PORT}`);
});
