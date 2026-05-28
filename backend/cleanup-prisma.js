import fs from 'fs';

const file = 'server/worker.js';
let code = fs.readFileSync(file, 'utf8');

const getPrismaStart = code.indexOf('const getPrisma = (env) => {');
if (getPrismaStart !== -1) {
  // Let's also remove `let prismaInstance = null;` which is a bit above it.
  const prismaInstanceIndex = code.lastIndexOf('let prismaInstance = null;', getPrismaStart);
  if (prismaInstanceIndex !== -1 && prismaInstanceIndex > getPrismaStart - 100) {
      code = code.substring(0, prismaInstanceIndex) + code.substring(getPrismaStart);
  }
  
  // Re-calculate since index changed
  const getPrismaStartNew = code.indexOf('const getPrisma = (env) => {');
  let openBraces = 1;
  let endIndex = code.indexOf('{', getPrismaStartNew) + 1;
  while (openBraces > 0 && endIndex < code.length) {
    if (code[endIndex] === '{') openBraces++;
    if (code[endIndex] === '}') openBraces--;
    endIndex++;
  }
  let blockEnd = endIndex;
  while (code[blockEnd] !== ';' && code[blockEnd] !== '\n') blockEnd++;
  code = code.substring(0, getPrismaStartNew) + code.substring(blockEnd + 1);
}

fs.writeFileSync(file, code);
