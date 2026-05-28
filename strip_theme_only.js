const fs = require('fs');

// ── 1. main.tsx: remove ThemeProvider ────────────────────────────────────────
let main = fs.readFileSync('frontend/src/main.tsx', 'utf8');
main = main.replace(/import \{ ThemeProvider \} from '\.\/context\/ThemeContext'\r?\n/g, '');
main = main.replace(/<ThemeProvider>\r?\n\s*/g, '');
main = main.replace(/\s*<\/ThemeProvider>/g, '');
fs.writeFileSync('frontend/src/main.tsx', main);
console.log('✅ main.tsx cleaned');

// ── 2. AdminSettingsPage: remove ONLY theme switching logic ───────────────────
let page = fs.readFileSync('frontend/src/pages/admin/AdminSettingsPage.tsx', 'utf8');

// Remove import
page = page.replace(/import \{ useTheme \} from '.*ThemeContext';\r?\n/g, '');
// Remove hook usage
page = page.replace(/const \{ theme, setTheme \} = useTheme\(\);\r?\n/g, '');
// Remove state
page = page.replace(/const \[isUpdatingTheme, setIsUpdatingTheme\] = useState\(false\);\r?\n/g, '');
// Remove theme branch in updatePreference
page = page.replace(/\s*if \(key === 'theme'\) \{[\s\S]*?setTheme\(value as any\);\s*\}/g, '');
// Remove setIsUpdatingTheme(false)
page = page.replace(/\s*setIsUpdatingTheme\(false\);/g, '');

// Remove the entire Dashboard Theme UI block
// The block starts with <div className="space-y-3 relative"> containing "Dashboard Theme" and ends </div></div>
const themeBlockStart = page.indexOf('Dashboard Theme');
if (themeBlockStart !== -1) {
  // Walk back to find the opening <div
  let searchBack = themeBlockStart;
  let depth = 0;
  // Find the wrapping <div className="space-y-3 relative">
  const openTag = '<div className="space-y-3 relative">';
  const blockStart = page.lastIndexOf(openTag, themeBlockStart);
  
  if (blockStart !== -1) {
    // Walk forward counting divs to find the matching closing </div>
    let pos = blockStart + openTag.length;
    let nestDepth = 1;
    while (pos < page.length && nestDepth > 0) {
      const nextOpen = page.indexOf('<div', pos);
      const nextClose = page.indexOf('</div>', pos);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        nestDepth++;
        pos = nextOpen + 4;
      } else {
        nestDepth--;
        if (nestDepth === 0) {
          const blockEnd = nextClose + '</div>'.length;
          page = page.slice(0, blockStart) + page.slice(blockEnd);
          console.log('✅ Dashboard Theme UI block removed');
          break;
        }
        pos = nextClose + 6;
      }
    }
  }
}

// Remove Moon from imports
page = page.replace(/,\s*Moon\b/g, '');
page = page.replace(/\bMoon,\s*/g, '');

fs.writeFileSync('frontend/src/pages/admin/AdminSettingsPage.tsx', page);
console.log('✅ AdminSettingsPage.tsx cleaned');

console.log('\n✅ All done — original luxury styling preserved, theme switcher removed.');
