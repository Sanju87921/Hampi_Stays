import express from 'express';
import * as bookingController from '../controllers/bookingController.js';
import { authenticate } from '../middleware/security.js';

const router = express.Router();

router.post('/', authenticate, bookingController.createBooking);
router.post('/:reference/verify-payment', authenticate, bookingController.verifyBookingPayment);
router.get('/reference/:reference', bookingController.getBookingByReference);

export default router;
