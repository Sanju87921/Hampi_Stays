export const securityMiddleware = () => {
  return async (c, next) => {
    // Security Headers
    c.res.headers.set('X-Content-Type-Options', 'nosniff');
    c.res.headers.set('X-Frame-Options', 'DENY');
    c.res.headers.set('X-XSS-Protection', '1; mode=block');
    c.res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    await next();
  };
};
