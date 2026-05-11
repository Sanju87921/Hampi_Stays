import * as paymentController from './paymentController.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map old routes to new secure logic
export const createBooking = paymentController.createOrder;
export const verifyBookingPayment = paymentController.verifyPayment;

export const getBookingByReference = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { referenceNumber: reference },
      include: { resort: true, user: true }
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (error) {
    next(error);
  }
};
