import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/security.js';

const router = express.Router();

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);

// Resort Management
router.get('/resorts/pending', adminController.getPendingResorts);
router.get('/resorts/active', adminController.getActiveResorts);
router.patch('/resorts/:id/status', adminController.updateResortStatus);

// Booking Management
router.get('/bookings/all', adminController.getAllBookings);

// Guide Management
router.get('/guides', adminController.getAllGuides);
router.patch('/guides/:id/status', adminController.updateGuideStatus);
router.patch('/guides/:id/toggle-active', adminController.toggleGuideActive);
router.patch('/guides/toggle-all', adminController.toggleAllGuides);

// Financials & Security
router.get('/payouts', adminController.getPayouts);
router.get('/security/stats', adminController.getSecurityStats);
router.get('/reviews/flagged', adminController.getFlaggedReviews);
router.get('/otp-logs', adminController.getOtpLogs);

// System Settings
router.patch('/settings', adminController.updateSettings);

export default router;
