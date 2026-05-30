import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

export const resortSchema = z.object({
  name: z.string().min(3, "Resort name must be at least 3 characters").max(100),
  tagline: z.string().max(200).optional(),
  description: z.string().min(50, "Description must be at least 50 characters"),
  type: z.enum(['VILLA', 'RESORT', 'HOMESTAY', 'CAMPING']),
  locationArea: z.string().min(2),
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
  pricePerNight: z.number().positive("Price must be greater than 0"),
  images: z.array(z.string().url()).min(1, "At least one image is required"),
  amenities: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  houseRules: z.array(z.string()).default([]),
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

export const validateResort = zValidator('json', resortSchema, formatError);
