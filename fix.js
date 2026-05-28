const fs = require('fs');

const path = 'backend/server/controllers/admin/admin.controller.js';
let content = fs.readFileSync(path, 'utf8');

// The file has literal \n outside strings. We just want to replace literal \n with real newline.
// But we must NOT replace \n inside strings. Wait, if it's literally \n in the file, it's just two chars: \ and n.
content = content.replace(/\\n/g, '\n');
content = content.replace(/\\t/g, '\t');
content = content.replace(/\\"/g, '"'); // wait, if there were literal strings, replacing \" might break them, but they might be properly encoded.

fs.writeFileSync('backend/server/controllers/admin/admin.controller.js', content, 'utf8');
