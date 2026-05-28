import fs from 'fs';

const file = 'server/worker.js';
let code = fs.readFileSync(file, 'utf8');

const targets = [
  { path: '/admin/stats', method: 'get', name: 'getAdminStats' },
  { path: '/admin/users', method: 'get', name: 'getAdminUsers' },
  { path: '/admin/users/:id', method: 'delete', name: 'deleteAdminUser' },
  { path: '/admin/resorts/pending', method: 'get', name: 'getPendingResorts' },
  { path: '/admin/resorts/active', method: 'get', name: 'getActiveResorts' },
  { path: '/admin/resorts/:id/status', method: 'patch', name: 'updateResortStatus' },
  { path: '/admin/resorts/:id/commission', method: 'patch', name: 'updateResortCommission' },
  { path: '/admin/resorts/:id/feature', method: 'patch', name: 'updateResortFeature' },
  { path: '/admin/guides', method: 'get', name: 'getAdminGuides' },
  { path: '/admin/guides/:id/status', method: 'patch', name: 'updateGuideStatus' },
  { path: '/admin/kyc-image/:id', method: 'get', name: 'getKycImage' },
  { path: '/admin/audit-logs', method: 'get', name: 'getAuditLogs' },
  { path: '/admin/guides/:id/toggle-active', method: 'patch', name: 'toggleGuideActive' },
  { path: '/admin/payouts', method: 'get', name: 'getPayouts' },
  { path: '/admin/security/stats', method: 'get', name: 'getSecurityStats' },
  { path: '/admin/reviews/flagged', method: 'get', name: 'getFlaggedReviews' },
  { path: '/admin/otp-logs', method: 'get', name: 'getOtpLogs' },
  { path: '/admin/coupons', method: 'get', name: 'getCoupons' },
  { path: '/admin/coupons', method: 'post', name: 'createCoupon' },
  { path: '/admin/coupons/:id/toggle', method: 'patch', name: 'toggleCoupon' },
  { path: '/admin/coupons/:id', method: 'delete', name: 'deleteCoupon' },
  { path: '/admin/coupons/analytics', method: 'get', name: 'getCouponAnalytics' },
  { path: '/hero-slides', method: 'get', name: 'getHeroSlides' },
  { path: '/hero-slides', method: 'post', name: 'createHeroSlide' },
  { path: '/hero-slides/:id', method: 'put', name: 'updateHeroSlide' },
  { path: '/hero-slides/:id', method: 'delete', name: 'deleteHeroSlide' },
  { path: '/hero-slides/reorder', method: 'post', name: 'reorderHeroSlides' }
];

let controllerCode = 'import { Resend } from "resend";\n' +
'import { logSecureError, logSecureWarn, logSecureInfo } from "../../utils/logger.js";\n' +
'import { decryptGuide, decryptUser, generateSignedKycUrlWorker, verifySignedKycUrlWorker, runKycFraudCheckWorker, decrypt } from "../../utils/cryptoEngine.js";\n\n';

let routesCode = 'import { Hono } from "hono";\n' +
'import * as adminController from "../../controllers/admin/admin.controller.js";\n\n' +
'const adminRoutes = new Hono();\n\n' +
'export const setupAdminRoutes = (app, authMiddleware, adminMiddleware) => {\n';

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

  const braceIndex = code.indexOf('{', startIndex);
  if (braceIndex === -1) {
      // Handle one-liners like (c) => c.json([])
      const arrowIndex = code.indexOf('=>', startIndex);
      if (arrowIndex !== -1) {
          let blockEnd = arrowIndex;
          while (code[blockEnd] !== ';' && code[blockEnd] !== '\\n') blockEnd++;
          const block = code.substring(startIndex, blockEnd + 1);
          code = code.replace(block, '// Extracted ' + t.method.toUpperCase() + ' ' + t.path + ' to admin controller');
          let body = block.substring(arrowIndex + 2).trim();
          if (body.endsWith(');')) body = body.substring(0, body.length - 2);
          else if (body.endsWith(')')) body = body.substring(0, body.length - 1);
          controllerCode += 'export const ' + t.name + ' = async (c) => { return ' + body + '; };\\n';
          
          let middlewares = ['authMiddleware', 'adminMiddleware'];
          const mwStr = middlewares.length > 0 ? middlewares.join(', ') + ', ' : '';
          routesCode += '  app.' + t.method + '(\'' + t.path + '\', ' + mwStr + 'adminController.' + t.name + ');\\n';
      }
      continue;
  }

  let openBraces = 1;
  let endIndex = braceIndex + 1;
  while (openBraces > 0 && endIndex < code.length) {
    if (code[endIndex] === '{') openBraces++;
    if (code[endIndex] === '}') openBraces--;
    endIndex++;
  }

  let blockEnd = endIndex;
  while (code[blockEnd] !== ';' && code[blockEnd] !== '\\n') blockEnd++;
  
  const block = code.substring(startIndex, blockEnd + 1);
  // Prevent replacing duplicates like GET /admin/coupons incorrectly
  const replaceStr = '// Extracted ' + t.method.toUpperCase() + ' ' + t.path + ' to admin controller';
  code = code.substring(0, startIndex) + replaceStr + code.substring(blockEnd + 1);

  let functionBody = block;
  const firstBraceIndex = functionBody.indexOf('{');
  if (firstBraceIndex !== -1) {
    functionBody = 'export const ' + t.name + ' = async (c) => {\\n  const getPrisma = c.get("getPrisma");' + functionBody.substring(firstBraceIndex + 1);
  }
  functionBody = functionBody.substring(0, functionBody.lastIndexOf('});')) + '};\\n';
  
  if (!functionBody.includes('const prisma = getPrisma(c.env);')) {
    functionBody = functionBody.replace(/export const.*?{/g, '$&\\n  const prisma = getPrisma(c.env);');
  }

  controllerCode += functionBody + '\\n';

  let middlewares = ['authMiddleware', 'adminMiddleware'];
  if (t.path === '/hero-slides' && t.method === 'get') {
    middlewares = [];
  }
  
  const mwStr = middlewares.length > 0 ? middlewares.join(', ') + ', ' : '';
  routesCode += '  app.' + t.method + '(\'' + t.path + '\', ' + mwStr + 'adminController.' + t.name + ');\\n';
}

const settingsMatch = code.indexOf("app.on(['POST', 'PATCH'], '/admin/settings'");
if (settingsMatch !== -1) {
  const braceIndex = code.indexOf('{', settingsMatch);
  let openBraces = 1;
  let endIndex = braceIndex + 1;
  while (openBraces > 0 && endIndex < code.length) {
    if (code[endIndex] === '{') openBraces++;
    if (code[endIndex] === '}') openBraces--;
    endIndex++;
  }
  let blockEnd = endIndex;
  while (code[blockEnd] !== ';' && code[blockEnd] !== '\\n') blockEnd++;
  
  const block = code.substring(settingsMatch, blockEnd + 1);
  code = code.substring(0, settingsMatch) + '// Extracted /admin/settings to admin controller' + code.substring(blockEnd + 1);
  
  let functionBody = block;
  const firstBraceIndex = functionBody.indexOf('{');
  if (firstBraceIndex !== -1) {
      functionBody = 'export const updateSettings = async (c) => {\\n  const getPrisma = c.get("getPrisma");' + functionBody.substring(firstBraceIndex + 1);
  }
  functionBody = functionBody.substring(0, functionBody.lastIndexOf('});')) + '};\\n';
  controllerCode += functionBody + '\\n';
  
  routesCode += '  app.on([\'POST\', \'PATCH\'], \'/admin/settings\', authMiddleware, adminMiddleware, adminController.updateSettings);\\n';
}

routesCode += '};\\n';

fs.mkdirSync('server/controllers/admin', { recursive: true });
fs.mkdirSync('server/routes/admin', { recursive: true });

fs.writeFileSync('server/controllers/admin/admin.controller.js', controllerCode);
fs.writeFileSync('server/routes/admin/index.js', routesCode);
fs.writeFileSync('server/worker.js', code);

fs.mkdirSync('server/services/admin', { recursive: true });
const services = ['user-management', 'kyc', 'curation', 'campaign', 'featured-resort', 'moderation', 'analytics', 'settings'];
services.forEach(s => {
  fs.writeFileSync('server/services/admin/' + s + '.service.js', '// ' + s + ' service stub\\nexport {};\\n');
});
fs.mkdirSync('server/validators/admin', { recursive: true });

console.log('Admin Extraction Complete');
