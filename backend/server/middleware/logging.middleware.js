import { AlertingSystem } from '../monitoring/alerting.js';

export const loggingMiddleware = () => {
  return async (c, next) => {
    const start = Date.now();
    
    // Generate Trace ID
    const traceId = crypto.randomUUID();
    c.set('traceId', traceId);
    c.res.headers.set('X-Trace-Id', traceId);

    // Provide trace log
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    console.log(`[TRACE:${traceId}] START ${c.req.method} ${c.req.url} [IP: ${ip}]`);

    await next();

    const ms = Date.now() - start;
    console.log(`[TRACE:${traceId}] END ${c.req.method} ${c.req.url} - ${c.res.status} - ${ms}ms`);

    // Performance Monitoring & Alerting
    if (ms > 2000 && c.env) {
      console.warn(`[PERFORMANCE_WARNING] Slow endpoint detected: ${c.req.method} ${c.req.url} took ${ms}ms (Trace ID: ${traceId})`);
      const alertSys = new AlertingSystem(c.env);
      // Fire and forget alert
      c.executionCtx.waitUntil(alertSys.alertHighLatency(c.req.url, ms));
    }
  };
};
