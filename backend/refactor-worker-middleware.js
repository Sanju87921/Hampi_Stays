import fs from 'fs';

const file = 'server/worker.js';
let code = fs.readFileSync(file, 'utf8');

// Replace standard logger import
const loggerRegex = /import \{ logger \} from 'hono\/logger';/;
if (loggerRegex.test(code)) {
  code = code.replace(loggerRegex, "import { loggingMiddleware } from './middleware/logging.middleware.js';\nimport { globalErrorHandler } from './middleware/errorHandler.middleware.js';");
}

const removeBlock = (startRegex, endRegex) => {
  const match = code.match(startRegex);
  if (!match) return;
  const startIndex = match.index;
  const remaining = code.substring(startIndex);
  const endMatch = remaining.match(endRegex);
  if (!endMatch) return;
  const endIndex = startIndex + endMatch.index + endMatch[0].length;
  code = code.substring(0, startIndex) + code.substring(endIndex);
};

// Remove Edge Rate Limiting section
removeBlock(/\/\/ \-\-\- Edge Rate Limiting \& Abuse Protection \-\-\-/, /const globalLimiter = createRateLimiter\([^)]+\);/);

// Remove Auth Middlewares block
removeBlock(/\/\/ Auth Middlewares/, /const adminMiddleware = async \(c, next\) => \{[^}]+\};\s*await next\(\);\s*\};/);
// In case the end regex for adminMiddleware failed:
const adminMatch = code.match(/const adminMiddleware = async \(c, next\) => \{[\s\S]*?await next\(\);\n\};/);
if (adminMatch) {
    code = code.replace(adminMatch[0], '');
}
const authMatch = code.match(/const authMiddleware = async \(c, next\) => \{[\s\S]*?await next\(\);\n  \} catch \(err\) \{ [\s\S]*?return c\.json\(\{ error: 'Invalid or expired token' \}, 401\); \n  \}\n\};/);
if (authMatch) {
    code = code.replace(authMatch[0], '');
}


// Replace app.use('*', logger()) with loggingMiddleware
code = code.replace(/app\.use\('\*', logger\(\)\);/, "app.use('*', loggingMiddleware());\napp.onError(globalErrorHandler);");

// Import middlewares
const mwImports = `
import { authMiddleware } from './middleware/auth.middleware.js';
import { adminMiddleware } from './middleware/admin.middleware.js';
import { globalLimiter, authLimiter, otpLimiter, bookingLimiter, uploadLimiter } from './middleware/rateLimiter.middleware.js';
`;
const importPos = code.indexOf('import { Hono }');
if (importPos !== -1) {
    code = code.substring(0, importPos) + mwImports + code.substring(importPos);
}

fs.writeFileSync(file, code);
console.log('Worker refactored');
