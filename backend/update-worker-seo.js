import fs from 'fs';

const workerFile = 'server/worker.js';
let workerCode = fs.readFileSync(workerFile, 'utf8');

const importStr = `import { setupSeoRoutes } from "./routes/seo/index.js";\n`;

if (!workerCode.includes('setupSeoRoutes')) {
  workerCode = workerCode.replace(
    `import { setupReferralRoutes } from "./routes/referrals/index.js";`,
    `import { setupReferralRoutes } from "./routes/referrals/index.js";\n${importStr}`
  );
  
  workerCode = workerCode.replace(
    `setupReferralRoutes(app, authMiddleware);`,
    `setupReferralRoutes(app, authMiddleware);\nsetupSeoRoutes(app);`
  );
  
  fs.writeFileSync(workerFile, workerCode);
  console.log('Worker updated with SEO routes successfully!');
}
