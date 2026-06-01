import { Hono } from 'hono';
import * as bookingController from '../../controllers/bookings/booking.controller.js';

const bookingRoutes = new Hono();

// Routes will be added here

export const setupBookingRoutes = (app, authMiddleware, adminMiddleware) => {
  app.get('/users/bookings', authMiddleware, bookingController.getUserBookings);
  app.get('/admin/bookings/all', authMiddleware, adminMiddleware, bookingController.getAllBookingsAdmin);
  app.post('/bookings', authMiddleware, bookingController.createBooking);
  app.get('/bookings/reference/:ref', authMiddleware, bookingController.getBookingByRef);
  app.patch('/bookings/:id/cancel', authMiddleware, bookingController.cancelBooking);
  app.patch('/bookings/:id/status', authMiddleware, bookingController.updateBookingStatus);
  app.get('/guides/:id/bookings', authMiddleware, bookingController.getGuideBookings);

  app.get('/bookings/:id/qr', authMiddleware, bookingController.getBookingQR);
  app.post('/bookings/qr/scan', authMiddleware, bookingController.scanBookingQR);
};
