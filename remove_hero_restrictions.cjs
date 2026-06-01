const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/admin/HeroModule.tsx', 'utf8');

// 1. Remove toggle restriction
content = content.replace(
  ' if (slide.isActive && activeSlides.length <= 2) { \\n toast.error(\\'Minimum 2 slides required\\'); \\n return; \\n }',
  ''
);

// Ah, wait, regex is safer. Let's write the exact block replacements.

