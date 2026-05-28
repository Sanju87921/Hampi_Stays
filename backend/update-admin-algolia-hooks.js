import fs from 'fs';

const controllerFile = 'server/controllers/admin/admin.controller.js';
let controllerCode = fs.readFileSync(controllerFile, 'utf8');

const importIndexer = "import { ResortIndexer } from '../../search/indexing/resortIndexer.js';\n";
if (!controllerCode.includes('ResortIndexer')) {
  controllerCode = importIndexer + controllerCode;
}

// Inject Algolia trigger in updateResortStatus
const statusHook = `
    const indexer = new ResortIndexer(c.env);
    c.executionCtx.waitUntil(indexer.indexResort(id));
`;

if (!controllerCode.includes('indexer.indexResort(id)') && controllerCode.includes('export const updateResortStatus')) {
  const targetRegex = /return c\.json\(updatedResort\);\n\s*\} catch \(err\)/;
  if (targetRegex.test(controllerCode)) {
      controllerCode = controllerCode.replace(/return c\.json\(updatedResort\);\n\s*\} catch \(err\)/, `${statusHook}\n    return c.json(updatedResort);\n  } catch (err)`);
  }
}

fs.writeFileSync(controllerFile, controllerCode);
console.log('Algolia hooks injected into Admin controller');
