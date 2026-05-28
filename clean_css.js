const fs = require('fs');
let css = fs.readFileSync('frontend/src/styles/globals.css', 'utf8');

css = css.replace(/@custom-variant dark \(\&:is\(\.dark \*\)\);/g, '');

const splitIndex = css.indexOf('/*');
let processed = css;
if (splitIndex > -1) {
    const lines = css.split('\n');
    const filteredLines = [];
    let insideDarkSection = false;
    for (const line of lines) {
        if (line.includes('Dark Mode Global Overrides')) {
            insideDarkSection = true;
        }
        
        if (!insideDarkSection) {
            filteredLines.push(line);
        }
    }
    processed = filteredLines.join('\n');
}

fs.writeFileSync('frontend/src/styles/globals.css', processed);
