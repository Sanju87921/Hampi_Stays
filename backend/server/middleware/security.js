import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import { body, validationResult } from 'express-validator';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}

/**
 * Authentication Middleware
 */
export const authenticate = (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.auth_token) {
    token = req.query.auth_token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Role-Based Access Control Middleware
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: Insufficient privileges' });
    }
    next();
  };
};

/**
 * Global Rate Limiter
 */
export const globalLimiter = process.env.NODE_ENV === 'production' ? rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
}) : (req, res, next) => next();

/**
 * Auth Rate Limiter (for login/register)
 */
export const authLimiter = process.env.NODE_ENV === 'production' ? rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login attempts per hour
  message: { error: 'Too many login attempts, please try again after an hour' },
  standardHeaders: true,
  legacyHeaders: false,
}) : (req, res, next) => next();

/**
 * OTP Send Rate Limiter (Prevent SMS/Email flood)
 */
export const otpSendLimiter = process.env.NODE_ENV === 'production' ? rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 OTP requests per hour
  message: { error: 'Too many verification codes requested. Please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
}) : (req, res, next) => next();

/**
 * OTP Verify Rate Limiter (Prevent brute-force)
 */
export const otpVerifyLimiter = process.env.NODE_ENV === 'production' ? rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 verification attempts per 15 mins
  message: { error: 'Too many failed attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
}) : (req, res, next) => next();

/**
 * Security Headers Configuration (Helmet)
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com", "https://ui-avatars.com", "https://lh3.googleusercontent.com"],
      connectSrc: [
        "'self'", 
        "https://api.razorpay.com", 
        "https://accounts.google.com",
        "https://newhampistays-production-54fa.up.railway.app",
        "http://localhost:5000",
        "http://localhost:5173"
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["'self'", "https://accounts.google.com", "https://api.razorpay.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // For Cloudinary/Unsplash images
});

/**
 * Parameter Pollution & Sanitization
 */
export const sanitizeRequest = [
  mongoSanitize(),
  hpp(),
];

/**
 * Validation Error Handler
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
