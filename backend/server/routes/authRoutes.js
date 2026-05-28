import express from 'express';
import * as authController from '../controllers/authController.js';
import * as otpController from '../controllers/otpController.js';
import { authenticate, authLimiter, otpSendLimiter, otpVerifyLimiter, validate } from '../middleware/security.js';
import { body } from 'express-validator';

const router = express.Router();

// Validation schemas
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 9 }).matches(/^(?=.*[!@#$%^&*(),.?":{}|<>]).*$/),
  body('name').trim().notEmpty(),
  body('role').isIn(['TRAVELLER', 'RESORT_OWNER', 'GUIDE', 'STAFF']),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
];

const resetPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('token').notEmpty().withMessage('Token is required'),
  body('password').isLength({ min: 9 }).withMessage('Password must be at least 9 characters long').matches(/^(?=.*[!@#$%^&*(),.?":{}|<>]).*$/).withMessage('Password must contain at least one special character'),
];

// Routes
router.post('/register', authLimiter, registerValidation, validate, authController.register);
router.post('/login', authLimiter, loginValidation, validate, authController.login);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, validate, authController.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidation, validate, authController.resetPassword);
router.post('/google', authLimiter, authController.googleAuth);
router.post('/apple', authLimiter, authController.appleAuth);
router.post('/check-email', authController.checkEmail);
router.get('/me', authenticate, authController.getMe);
router.post('/refresh', authController.refreshToken);

// OTP Routes
router.post('/send-email-otp', otpSendLimiter, otpController.sendEmailOtp);
router.post('/send-mobile-otp', otpSendLimiter, otpController.sendMobileOtp);
router.post('/verify-otp', otpVerifyLimiter, otpController.verifyOtp);

export default router;
