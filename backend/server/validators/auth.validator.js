import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

// ---------------------------------------------------------
// REUSABLE ZOD SCHEMAS FOR VALIDATION
// ---------------------------------------------------------

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format").optional(),
  role: z.enum(['TRAVELLER', 'RESORT_OWNER', 'GUIDE', 'STAFF']).default('TRAVELLER')
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

export const otpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  type: z.enum(['email', 'mobile']).default('email')
});

// ---------------------------------------------------------
// HONO MIDDLEWARES WITH STANDARDIZED ERROR FORMAT
// ---------------------------------------------------------

const formatError = (result, c) => {
  if (!result.success) {
    return c.json({
      success: false,
      error: "Validation failed",
      details: result.error.issues.map(i => ({ path: i.path, message: i.message }))
    }, 400);
  }
};

export const validateRegister = zValidator('json', registerSchema, formatError);
export const validateLogin = zValidator('json', loginSchema, formatError);
export const validateOtp = zValidator('json', otpSchema, formatError);
