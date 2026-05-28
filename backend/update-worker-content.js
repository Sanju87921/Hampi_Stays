import fs from 'fs';

const workerFile = 'server/worker.js';
let workerCode = fs.readFileSync(workerFile, 'utf8');

const importStr = `import { setupContentRoutes } from "./routes/content/index.js";\n`;

if (!workerCode.includes('setupContentRoutes')) {
  workerCode = workerCode.replace(
    `import { setupSeoRoutes } from "./routes/seo/index.js";`,
    `import { setupSeoRoutes } from "./routes/seo/index.js";\n${importStr}`
  );
  
  workerCode = workerCode.replace(
    `setupSeoRoutes(app);`,
    `setupSeoRoutes(app);\nsetupContentRoutes(app, authMiddleware, adminMiddleware);`
  );
  
  fs.writeFileSync(workerFile, workerCode);
  console.log('Worker updated with Content routes successfully!');
}
