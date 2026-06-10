const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        filelist = walkSync(filePath, filelist);
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.ts')) {
        filelist.push(filePath);
      }
    }
  });
  return filelist;
};

const BANNED_PATTERNS = [
  /room_id/,
  /resort_id/,
  /booking_id/,
  /owner_id/,
  /user_id/,
  /\$queryRaw\`[^\`]*SELECT/i
];

const ALLOWED_FILES = [
  'health.js' // Allowed for SELECT 1
];

let failed = false;
const files = walkSync(path.join(__dirname, 'server'));

for (const file of files) {
  if (ALLOWED_FILES.some(allowed => file.endsWith(allowed))) continue;

  const content = fs.readFileSync(file, 'utf8');
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(content)) {
      console.error(`FAIL: Found banned pattern ${pattern} in file ${file}`);
      failed = true;
    }
  }
}

if (failed) {
  console.error('Automated Test Failed: Codebase contains raw SQL or hardcoded snake_case column names.');
  process.exit(1);
} else {
  console.log('Automated Test Passed: No raw SQL or hardcoded snake_case columns detected.');
  process.exit(0);
}
