import fs from 'fs';

const file = 'server/middleware/errorHandler.middleware.js';
let code = fs.readFileSync(file, 'utf8');

const importLines = `import { SentryMonitor } from '../monitoring/sentry.js';\nimport { AlertingSystem } from '../monitoring/alerting.js';\n`;
code = importLines + code;

const unhandledErrorMatch = `// Unhandled errors
  console.error('[UNHANDLED ERROR]', err);`;

const replacement = `// Unhandled errors
  console.error('[UNHANDLED ERROR]', err);
  
  if (c.env) {
    const sentry = new SentryMonitor(c.env, c.req.raw);
    sentry.captureException(err, { traceId: c.get('traceId'), url: c.req.url });
    
    if (err.name !== 'ValidationError') {
      const alertSys = new AlertingSystem(c.env);
      c.executionCtx.waitUntil(alertSys.sendAlert('error', 'Unhandled Backend Exception', err.message, { stack: err.stack, traceId: c.get('traceId') }));
    }
  }`;

if (code.includes(unhandledErrorMatch)) {
  code = code.replace(unhandledErrorMatch, replacement);
  fs.writeFileSync(file, code);
  console.log('Error handler updated with Sentry and Alerting');
} else {
  console.log('Unhandled error block not found!');
}
