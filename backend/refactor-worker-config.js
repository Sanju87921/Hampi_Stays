import fs from 'fs';

const file = 'server/worker.js';
let code = fs.readFileSync(file, 'utf8');

// Replace getPrisma logic
const getPrismaRegex = /let prismaInstance = null;\n\nconst getPrisma = \(env\) => \{[\s\S]*?return prismaInstance;\n\};/;
const match = code.match(getPrismaRegex);
if (match) {
    code = code.replace(match[0], '');
}

const importString = "import { getPrisma } from './config/prisma.js';\nimport { securityMiddleware } from './middleware/security.middleware.js';\n";
const firstImport = code.indexOf('import ');
code = code.substring(0, firstImport) + importString + code.substring(firstImport);

const globalLimiterIndex = code.indexOf("app.use('*', globalLimiter);");
if (globalLimiterIndex !== -1) {
    code = code.replace("app.use('*', globalLimiter);", "app.use('*', securityMiddleware());\napp.use('*', globalLimiter);");
} else {
    // try fallback
    const fallbackLimiter = code.indexOf('return globalLimiter(c, next);');
    if (fallbackLimiter !== -1) {
        code = code.replace("if (c.req.method === 'OPTIONS') return next();\n  return globalLimiter(c, next);", "if (c.req.method === 'OPTIONS') return next();\n  await securityMiddleware()(c, async () => {});\n  return globalLimiter(c, next);");
    }
}

fs.writeFileSync(file, code);
console.log('Worker Prisma and Security updated');
