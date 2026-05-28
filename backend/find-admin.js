import fs from 'fs';

const file = 'server/worker.js';
let code = fs.readFileSync(file, 'utf8');

const lines = code.split('\n');
const adminRoutes = [];

lines.forEach((l, i) => {
  const match = l.match(/app\.(get|post|patch|delete)\(\s*['"](\/admin\/[^'"]+)['"]/);
  if (match) {
    adminRoutes.push({ line: i + 1, method: match[1], path: match[2] });
  } else {
    // Handle app.on(['POST', 'PATCH'], '/admin/settings')
    const matchOn = l.match(/app\.on\([^,]+,\s*['"](\/admin\/[^'"]+)['"]/);
    if (matchOn) {
      adminRoutes.push({ line: i + 1, method: 'on', path: matchOn[1] });
    }
  }
});

console.log(JSON.stringify(adminRoutes, null, 2));
