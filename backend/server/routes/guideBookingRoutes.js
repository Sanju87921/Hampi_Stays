import express from 'express';
import * as guideController from '../controllers/guideController.js';
import { authenticate } from '../middleware/security.js';

const router = express.Router();

router.use(authenticate);

router.patch('/:bookingId/status', guideController.updateGuideBookingStatus);

export default router;
