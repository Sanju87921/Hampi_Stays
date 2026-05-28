const fs = require('fs');

let code = fs.readFileSync('frontend/src/pages/admin/AdminSettingsPage.tsx', 'utf8');

// Remove the `if (key === 'theme') { ... }`
code = code.replace(/if\s*\(key\s*===\s*'theme'\)\s*\{\s*setIsUpdatingTheme\(true\);\s*setTheme\(value\s*as\s*any\);\s*\}/g, '');

// Remove the `setIsUpdatingTheme(false);`
code = code.replace(/setIsUpdatingTheme\(false\);/g, '');

// Remove the theme state variables and ThemeContext usage
code = code.replace(/const \{ theme, setTheme \} = useTheme\(\);\s*/g, '');
code = code.replace(/const \[isUpdatingTheme, setIsUpdatingTheme\] = useState\(false\);\s*/g, '');
code = code.replace(/import \{ useTheme \} from '\.\.\/\.\.\/context\/ThemeContext';\s*/g, '');

// Remove the Dashboard Theme UI
const themeUIRegex = /<div className="space-y-3 relative">[\s\S]*?<label className="text-sm font-bold text-navy-950 dark:text-white flex items-center">[\s\S]*?<Moon.*?Dashboard Theme[\s\S]*?<\/div>[\s\S]*?<\/div>/g;
code = code.replace(themeUIRegex, '');

// Adjust grid columns
code = code.replace(/className="grid grid-cols-1 md:grid-cols-2 gap-6"/g, 'className="grid grid-cols-1 gap-6"');

// Remove Moon import
code = code.replace(/Moon,\s*/g, '');

fs.writeFileSync('frontend/src/pages/admin/AdminSettingsPage.tsx', code);
console.log('Done refactoring AdminSettingsPage');
