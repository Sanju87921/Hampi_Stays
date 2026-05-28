import fs from 'fs';

const routeFile = 'server/routes/admin/index.js';
let routeCode = fs.readFileSync(routeFile, 'utf8');

if (!routeCode.includes('/admin/search/sync')) {
  routeCode = routeCode.replace('};\n', "  app.post('/admin/search/sync', authMiddleware, adminMiddleware, adminController.syncAlgoliaSearch);\n};\n");
  // Replace the literal string \n that somehow got into the file earlier?
  routeCode = routeCode.split('\\n').join('\n');
  fs.writeFileSync(routeFile, routeCode);
  console.log('Route added');
}

const controllerFile = 'server/controllers/admin/admin.controller.js';
let controllerCode = fs.readFileSync(controllerFile, 'utf8');

if (!controllerCode.includes('syncAlgoliaSearch')) {
  const importString = "import { triggerAlgoliaSync } from '../../search/indexing/sync.js';\n";
  controllerCode = importString + controllerCode;

  const controllerFunction = `
export const syncAlgoliaSearch = async (c) => {
  const result = await triggerAlgoliaSync(c.env);
  if (result.success) {
    return c.json({ message: \`Successfully synced \${result.count} resorts to Algolia\` });
  } else {
    return c.json({ error: result.error }, 500);
  }
};
`;
  controllerCode += controllerFunction;
  fs.writeFileSync(controllerFile, controllerCode);
  console.log('Controller added');
}
