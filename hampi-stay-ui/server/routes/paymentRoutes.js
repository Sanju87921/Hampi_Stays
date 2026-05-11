import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { authenticate, validate } from '../middleware/security.js';
import { body } from 'express-validator';

const router = express.Router();

const orderValidation = [
  body('resortId').isString().notEmpty(),
  body('roomId').isString().notEmpty(),
  body('checkIn').isISO8601(),
  body('checkOut').isISO8601(),
  body('guests').isInt({ min: 1 }),
];

router.post('/create-order', authenticate, orderValidation, validate, paymentController.createOrder);
router.post('/verify-payment', authenticate, paymentController.verifyPayment);

export default router;
