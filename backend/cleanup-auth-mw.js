import fs from 'fs';

const file = 'server/worker.js';
let code = fs.readFileSync(file, 'utf8');

const authStart = code.indexOf('const authMiddleware = async (c, next) => {');
if (authStart !== -1) {
  let openBraces = 1;
  let endIndex = code.indexOf('{', authStart) + 1;
  while (openBraces > 0 && endIndex < code.length) {
    if (code[endIndex] === '{') openBraces++;
    if (code[endIndex] === '}') openBraces--;
    endIndex++;
  }
  let blockEnd = endIndex;
  while (code[blockEnd] !== ';' && code[blockEnd] !== '\n') blockEnd++;
  code = code.substring(0, authStart) + code.substring(blockEnd + 1);
}

const adminStart = code.indexOf('const adminMiddleware = async (c, next) => {');
if (adminStart !== -1) {
  let openBraces = 1;
  let endIndex = code.indexOf('{', adminStart) + 1;
  while (openBraces > 0 && endIndex < code.length) {
    if (code[endIndex] === '{') openBraces++;
    if (code[endIndex] === '}') openBraces--;
    endIndex++;
  }
  let blockEnd = endIndex;
  while (code[blockEnd] !== ';' && code[blockEnd] !== '\n') blockEnd++;
  code = code.substring(0, adminStart) + code.substring(blockEnd + 1);
}

fs.writeFileSync(file, code);
