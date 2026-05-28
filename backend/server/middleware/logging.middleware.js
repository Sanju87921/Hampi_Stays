export const loggingMiddleware = () => {
  return async (c, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    console.log(`[REQ] ${c.req.method} ${c.req.url} - ${c.res.status} - ${ms}ms [IP: ${ip}]`);
  };
};
