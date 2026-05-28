// --- Edge Rate Limiting & Abuse Protection ---
const rateLimitCache = new Map();

const getClientIp = (c) => c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';

export const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000;
  const maxRequests = options.maxRequests || 100;
  
  return async (c, next) => {
    // Skip OPTIONS preflight requests so they never count against limits
    if (c.req.method === 'OPTIONS') return next();

    const ip = getClientIp(c);
    const key = `${ip}:${options.name || 'global'}`;
    const now = Date.now();
    let record = rateLimitCache.get(key);
    
    if (!record) {
      record = { count: 1, resetTime: now + windowMs };
      rateLimitCache.set(key, record);
    } else {
      if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
      } else {
        record.count++;
      }
    }

    if (record.count > maxRequests) {
      console.warn(`[ABUSE DETECTED] Rate limit exceeded for IP: ${ip} on limiter: ${options.name}`);
      return c.json({ 
        error: options.message || "Too many requests detected. Please wait a moment before trying again." 
      }, 429);
    }

    // Clean up stale cache randomly (5% chance per request) to prevent isolate memory leaks
    if (Math.random() < 0.05) {
      for (const [k, v] of rateLimitCache.entries()) {
        if (now > v.resetTime) rateLimitCache.delete(k);
      }
    }

    await next();
  };
};

export const authLimiter = createRateLimiter({ name: 'auth', windowMs: 15 * 60 * 1000, maxRequests: 5, message: "Too many login attempts. Please wait 15 minutes." });
export const otpLimiter = createRateLimiter({ name: 'otp', windowMs: 10 * 60 * 1000, maxRequests: 3, message: "Too many OTP requests. Please wait 10 minutes." });
export const bookingLimiter = createRateLimiter({ name: 'booking', windowMs: 10 * 60 * 1000, maxRequests: 10, message: "Too many booking attempts. Please slow down." });
export const uploadLimiter = createRateLimiter({ name: 'upload', windowMs: 60 * 60 * 1000, maxRequests: 30, message: "Upload limit reached. Try again later." });
export const globalLimiter = createRateLimiter({ name: 'global', windowMs: 1 * 60 * 1000, maxRequests: 300, message: "Too many requests detected. Please wait a moment before trying again." });
