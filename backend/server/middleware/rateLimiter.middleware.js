// --- Edge Rate Limiting & Abuse Protection ---
const rateLimitCache = new Map();

const getClientIp = (c) => c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';

export const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000;
  const maxRequests = options.maxRequests || 100;
  
  return async (c, next) => {
    // Skip OPTIONS preflight requests
    if (c.req.method === 'OPTIONS') return next();

    const ip = getClientIp(c);
    const key = `ratelimit:${options.name || 'global'}:${ip}`;
    
    // Upstash Redis implementation for Edge synchronization
    if (c.env && c.env.UPSTASH_REDIS_REST_URL && c.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const url = `${c.env.UPSTASH_REDIS_REST_URL}/pipeline`;
        
        // Multi-command pipeline: Increment and then get TTL
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${c.env.UPSTASH_REDIS_REST_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([
            ['INCR', key],
            ['PTTL', key]
          ])
        });

        if (response.ok) {
          const results = await response.json();
          // Pipeline returns array of objects with {result: ...}
          const count = results[0].result;
          const ttl = results[1].result;

          // If this was the first request (TTL is -1 or no TTL), set expiry
          if (count === 1 || ttl < 0) {
            await fetch(url, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${c.env.UPSTASH_REDIS_REST_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify([['PEXPIRE', key, windowMs]])
            });
          }

          if (count > maxRequests) {
            console.warn(`[ABUSE DETECTED] Redis Rate limit exceeded for IP: ${ip} on limiter: ${options.name}`);
            return c.json({ 
              error: options.message || "Too many requests detected. Please wait a moment before trying again." 
            }, 429);
          }
          
          return await next();
        }
      } catch (err) {
        console.error("Upstash Redis Rate Limiting Failed, falling back to memory:", err);
        // Fallback to memory if redis fetch fails
      }
    }

    // Memory Fallback (Local Dev / Redis Failure)
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
      console.warn(`[ABUSE DETECTED] Memory Rate limit exceeded for IP: ${ip} on limiter: ${options.name}`);
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
