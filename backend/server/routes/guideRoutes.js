import express from 'express';
import * as guideController from '../controllers/guideController.js';
import { authenticate } from '../middleware/security.js';

const router = express.Router();

// Profile routes (Must be before public /:id)
router.get('/profile/:userId', authenticate, guideController.getGuideProfileByUserId);
router.patch('/profile/:userId', authenticate, guideController.updateGuideProfileByUserId);

// Booking routes
router.get('/:id/bookings', authenticate, guideController.getGuideBookings);
router.post('/:guideId/book', authenticate, guideController.bookGuide);

// Public routes
router.get('/', guideController.getAllGuides);
router.get('/:id', guideController.getGuideById);

export default router;
