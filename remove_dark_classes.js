const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Safe regex to replace dark: classes with nothing, leaving spaces intact.
            // Matches optional state prefixes like hover:, focus:, etc.
            const darkRegex = /(?:hover:|focus:|active:|group-hover:)?dark:[a-zA-Z0-9\-\/\[\]\.\%]+/g;
            if (darkRegex.test(content)) {
                content = content.replace(darkRegex, '');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Cleaned ${fullPath}`);
            }
        }
    }
}

processDir(path.join(__dirname, 'frontend/src'));
console.log('Finished removing all dark: classes safely.');
