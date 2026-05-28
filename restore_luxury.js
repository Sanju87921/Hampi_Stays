const fs = require('fs');
const path = require('path');

// Mapping: dark zinc/black backgrounds → luxury sand/white equivalents
const luxuryReplacements = [
  // Backgrounds
  [/\bbg-zinc-950\b/g,   'bg-sand-50'],
  [/\bbg-zinc-900\b/g,   'bg-white'],
  [/\bbg-zinc-800\b/g,   'bg-sand-100'],
  [/\bbg-zinc-800\/50\b/g, 'bg-sand-100/50'],
  [/\bbg-zinc-700\b/g,   'bg-sand-200'],
  [/\bbg-black\b/g,      'bg-sand-50'],
  // Borders
  [/\bborder-zinc-800\b/g,    'border-sand-200'],
  [/\bborder-zinc-800\/50\b/g,'border-sand-200/50'],
  [/\bborder-zinc-700\b/g,    'border-sand-200'],
  // Text
  [/\btext-zinc-400\b/g,  'text-navy-950/60'],
  [/\btext-zinc-500\b/g,  'text-navy-950/50'],
  [/\btext-zinc-300\b/g,  'text-navy-950/70'],
  [/\btext-zinc-200\b/g,  'text-navy-950/80'],
  // Hover backgrounds
  [/\bhover:bg-zinc-800\b/g,     'hover:bg-sand-100'],
  [/\bhover:bg-zinc-700\b/g,     'hover:bg-sand-200'],
  [/\bhover:bg-zinc-900\/50\b/g, 'hover:bg-sand-50'],
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Step 1: Remove ALL dark: prefixed Tailwind classes (fixed regex bug)
  const cleaned = content.replace(/(?:hover:|focus:|active:|group-hover:)?dark:[a-zA-Z0-9\-\/\[\]\.\%]+/g, '');
  if (cleaned !== content) {
    content = cleaned;
    modified = true;
  }

  // Step 2: Replace remaining zinc/dark backgrounds with luxury equivalents
  for (const [pattern, replacement] of luxuryReplacements) {
    const next = content.replace(pattern, replacement);
    if (next !== content) {
      content = next;
      modified = true;
    }
  }

  // Step 3: Clean up double spaces in className strings
  content = content.replace(/ {2,}/g, ' ');

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Cleaned: ${path.basename(filePath)}`);
  }
}

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (/\.(tsx|ts|css)$/.test(entry.name)) {
      processFile(fullPath);
    }
  }
}

processDir(path.join(__dirname, 'frontend/src'));
console.log('\n✅ Admin luxury theme restoration complete.');
