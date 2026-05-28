import fs from 'fs';

const workerFile = 'server/worker.js';
let workerCode = fs.readFileSync(workerFile, 'utf8');

const imports = `import { setupCouponRoutes } from "./routes/coupons/index.js";\nimport { setupReferralRoutes } from "./routes/referrals/index.js";\n`;

if (!workerCode.includes('setupCouponRoutes')) {
  workerCode = workerCode.replace(
    `import { setupAuthRoutes } from "./routes/auth/index.js";`,
    `import { setupAuthRoutes } from "./routes/auth/index.js";\n${imports}`
  );
  
  workerCode = workerCode.replace(
    `app.get('/health', (c) => {`,
    `setupCouponRoutes(app, authMiddleware, adminMiddleware);\nsetupReferralRoutes(app, authMiddleware);\n\napp.get('/health', (c) => {`
  );
  
  fs.writeFileSync(workerFile, workerCode);
  console.log('Worker routes updated successfully!');
}
