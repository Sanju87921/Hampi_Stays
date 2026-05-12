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
      include: { resort: true, user: true, room: true }
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (error) {
    next(error);
  }
};

export const confirmBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: { user: true, resort: true }
    });
    
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: 'Booking Confirmed! ✨',
        message: `Your retreat at ${booking.resort.name} is officially confirmed. We look forward to your arrival!`,
        type: 'BOOKING_UPDATE'
      }
    });

    res.json(booking);
  } catch (error) {
    next(error);
  }
};

export const rejectBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { user: true, resort: true }
    });

    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: 'Booking Update',
        message: `Unfortunately, your booking at ${booking.resort.name} could not be confirmed at this time.`,
        type: 'BOOKING_UPDATE'
      }
    });

    res.json(booking);
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: { user: true, resort: true }
    });

    res.json(booking);
  } catch (error) {
    next(error);
  }
};

export const welcomeGreet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { user: true, resort: true }
    });

    if (booking) {
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          title: 'Welcome to Hampi! 🏛️',
          message: `Welcome to ${booking.resort.name}. We hope you have a majestic stay in the heritage land of Vijayanagara.`,
          type: 'WELCOME'
        }
      });
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
