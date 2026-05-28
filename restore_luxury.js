const fs = require('fs');
const path = require('path');

// Strategy: restore the STATIC luxury values that the dark: classes used to provide.
// The admin was always dark-navy themed - these were not light/dark alternates,
// they were the ONLY styling. We restore them as permanent static values.

const FILE_REPLACEMENTS = {
  'frontend/src/components/layout/Navbar.tsx': [
    // Administrator badge - transparent glass when not scrolled
    [
      `isScrolled ? "bg-navy-950 text-white border-navy-950 shadow-md" : "bg-white  text-white border-white/20 backdrop-blur-md"`,
      `isScrolled ? "bg-navy-950 text-white border-navy-950 shadow-md" : "bg-white/10 text-white border-white/20 backdrop-blur-md"`
    ],
    // Mobile menu backdrop
    [
      `"absolute top-full left-0 right-0 bg-sand-50  backdrop-blur-2xl shadow-luxury border-t border-sand-200  flex flex-col md:hidden overflow-hidden"`,
      `"absolute top-full left-0 right-0 bg-sand-50/95 backdrop-blur-2xl shadow-luxury border-t border-sand-200 flex flex-col md:hidden overflow-hidden"`
    ],
    // Logout button - unscrolled
    [
      `": "border-white/20 text-white hover:bg-white "`,
      `": "border-white/20 text-white hover:bg-white/10"`
    ],
    // Book Now button - unscrolled
    [
      `": "bg-gold-500 text-navy-950  hover:bg-white  hover:text-navy-950  shadow-2xl shadow-gold-500/20"`,
      `": "bg-gold-500 text-navy-950 hover:bg-white/90 hover:text-navy-950 shadow-2xl shadow-gold-500/20"`
    ],
  ],

  'frontend/src/pages/admin/AdminDashboard.tsx': [
    // Command center buttons (Verify Payouts, Newsletter, Reviews) — white/translucent on navy
    [
      `"w-full bg-white  hover:bg-white  border-white/10 text-white justify-start gap-3 h-14 rounded-2xl relative"`,
      `"w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white justify-start gap-3 h-14 rounded-2xl relative"`
    ],
    [
      `"w-full bg-white  hover:bg-white  border-white/10 text-white justify-start gap-3 h-14 rounded-2xl"`,
      `"w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white justify-start gap-3 h-14 rounded-2xl"`
    ],
  ],
};

// Generic global replacements across ALL admin files
const GLOBAL_REPLACEMENTS = [
  // bg-zinc-900 → bg-navy-950 (primary dark luxury surface)
  [/\bbg-zinc-900\b/g, 'bg-navy-950'],
  // bg-zinc-950 → bg-navy-950 (deepest surface)
  [/\bbg-zinc-950\b/g, 'bg-navy-950'],
  // bg-zinc-800 → bg-navy-800 (card surface)
  [/\bbg-zinc-800\b/g, 'bg-navy-800'],
  // border-zinc-800 → border-navy-800
  [/\bborder-zinc-800\b/g, 'border-navy-800'],
  // border-zinc-700 → border-navy-700
  [/\bborder-zinc-700\b/g, 'border-navy-700'],
  // text-zinc-400 → text-sand-300
  [/\btext-zinc-400\b/g, 'text-sand-300'],
  // text-zinc-300 → text-sand-200
  [/\btext-zinc-300\b/g, 'text-sand-200'],
  // text-zinc-500 → text-navy-400
  [/\btext-zinc-500\b/g, 'text-navy-400'],
  // text-zinc-600 → text-navy-500  
  [/\btext-zinc-600\b/g, 'text-navy-500'],
];

const ADMIN_DIRS = [
  'frontend/src/pages/admin',
  'frontend/src/components/admin',
  'frontend/src/components/layout/Navbar.tsx',
];

function processFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // File-specific replacements
  const fileKey = filePath.replace(/\\/g, '/');
  if (FILE_REPLACEMENTS[fileKey]) {
    for (const [from, to] of FILE_REPLACEMENTS[fileKey]) {
      if (content.includes(from)) {
        content = content.split(from).join(to);
        modified = true;
      }
    }
  }

  // Global replacements only for admin files
  for (const [pattern, replacement] of GLOBAL_REPLACEMENTS) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Restored: ${filePath}`);
  }
}

function processDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const stat = fs.statSync(dirPath);
  if (stat.isFile()) {
    processFile(dirPath);
    return;
  }
  const entries = fs.readdirSync(dirPath);
  for (const entry of entries) {
    processDir(path.join(dirPath, entry));
  }
}

for (const target of ADMIN_DIRS) {
  processDir(target);
}

console.log('\n✅ Luxury admin styling restored.');
