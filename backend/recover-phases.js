import fs from 'fs';

const file = 'server/worker.js';
let code = fs.readFileSync(file, 'utf8');

const targets = [
  { path: '/auth/register', method: 'post' },
  { path: '/auth/login', method: 'post' },
  { path: '/auth/google', method: 'post' },
  { path: '/auth/me', method: 'get' },
  { path: '/auth/refresh', method: 'post' },
  { path: '/auth/logout', method: 'post' },
  { path: '/auth/verify-otp', method: 'post' },
  { path: '/auth/resend-otp', method: 'post' },
  { path: '/bookings', method: 'post' },
  { path: '/bookings', method: 'get' },
  { path: '/bookings/reference/:ref', method: 'get' },
  { path: '/bookings/:ref/verify-payment', method: 'post' },
  { path: '/payments/webhook', method: 'post' }
];

let foundAuth = false;
let foundBookings = false;
let foundPayments = false;

for (const t of targets) {
  const searchStrs = [
    'app.' + t.method + '(\'' + t.path + '\'',
    'app.' + t.method + '("' + t.path + '"'
  ];
  
  let startIndex = -1;
  for (const s of searchStrs) {
    startIndex = code.indexOf(s);
    if (startIndex !== -1) break;
  }
  
  if (startIndex === -1) {
    console.log('Not found:', t.method, t.path);
    continue;
  }

  if (t.path.startsWith('/auth')) foundAuth = true;
  if (t.path.startsWith('/bookings')) foundBookings = true;
  if (t.path.startsWith('/payments')) foundPayments = true;

  const braceIndex = code.indexOf('{', startIndex);
  if (braceIndex === -1) continue;

  let openBraces = 1;
  let endIndex = braceIndex + 1;
  while (openBraces > 0 && endIndex < code.length) {
    if (code[endIndex] === '{') openBraces++;
    if (code[endIndex] === '}') openBraces--;
    endIndex++;
  }

  let blockEnd = endIndex;
  while (code[blockEnd] !== ';' && code[blockEnd] !== '\n') blockEnd++;
  
  const block = code.substring(startIndex, blockEnd + 1);
  const replaceStr = '// Extracted ' + t.method.toUpperCase() + ' ' + t.path + ' to respective controller';
  code = code.substring(0, startIndex) + replaceStr + code.substring(blockEnd + 1);
}

// Add imports and mount points
let lines = code.split('\n');
const importIndex = lines.findIndex(l => l.includes('import { setupAdminRoutes }') || l.includes('import { Resend }'));
const insertPos = importIndex !== -1 ? importIndex : 15; // fallback

if (foundAuth && !code.includes('import { setupAuthRoutes }')) lines.splice(insertPos, 0, 'import { setupAuthRoutes } from "./routes/auth/index.js";');
if (foundBookings && !code.includes('import { setupBookingRoutes }')) lines.splice(insertPos, 0, 'import { setupBookingRoutes } from "./routes/bookings/index.js";');
if (foundPayments && !code.includes('import { setupPaymentRoutes }')) lines.splice(insertPos, 0, 'import { setupPaymentRoutes } from "./routes/payments/index.js";');

const setupIndex = lines.findIndex(l => l.includes('setupAdminRoutes(') || l.includes('app.get("/api/health"'));
const mountPos = setupIndex !== -1 ? setupIndex : lines.length - 20;

if (foundPayments && !code.includes('setupPaymentRoutes(')) lines.splice(mountPos, 0, 'setupPaymentRoutes(app, authMiddleware);');
if (foundBookings && !code.includes('setupBookingRoutes(')) lines.splice(mountPos, 0, 'setupBookingRoutes(app, authMiddleware);');
if (foundAuth && !code.includes('setupAuthRoutes(')) lines.splice(mountPos, 0, 'setupAuthRoutes(app, authMiddleware);');

fs.writeFileSync('server/worker.js', lines.join('\n'));
console.log('Restored module extractions for worker.js');
