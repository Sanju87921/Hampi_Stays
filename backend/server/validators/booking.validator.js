import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

export const bookingSchema = z.object({
  resortId: z.string().min(1, "Resort ID is required"),
  roomId: z.string().optional(),
  checkIn: z.string().datetime("Invalid Check-In Date"),
  checkOut: z.string().datetime("Invalid Check-Out Date"),
  guests: z.number().int().positive("Must have at least 1 guest").max(50),
  specialRequests: z.string().max(500).optional(),
  addInsurance: z.boolean().default(false),
  airportPickup: z.boolean().default(false),
  couponCode: z.string().nullable().optional(),
  promotionId: z.string().nullable().optional(),
  promotionName: z.string().nullable().optional(),
  discountAmount: z.number().nullable().optional()
});

const formatError = (result, c) => {
  if (!result.success) {
    return c.json({
      success: false,
      error: "Validation failed",
      details: result.error.issues.map(i => ({ path: i.path, message: i.message }))
    }, 400);
  }
};

export const validateBooking = zValidator('json', bookingSchema, formatError);
