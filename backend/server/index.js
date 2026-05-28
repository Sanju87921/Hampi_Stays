import { serve } from '@hono/node-server';
import app from './worker.js';

const PORT = process.env.PORT || 5000;

serve({
  fetch: app.fetch,
  port: PORT
}, (info) => {
  console.log(`
    ==================================================
    🚀 HAMPISTAYS HONO EDGE RUNNING (NODE ADAPTER)
    🛡️  MODE: ${process.env.NODE_ENV || 'development'}
    📍 PORT: ${info.port}
    🏠 URL:  http://localhost:${info.port}
    ==================================================
  `);
});
