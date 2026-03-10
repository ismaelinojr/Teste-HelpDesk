import fs from 'fs';
const file = 'c:/Users/ismae/OneDrive/Documents/Teste-HelpDesk/src/mocks/mockData.ts';
let content = fs.readFileSync(file, 'utf8');

let lines = content.split('\n');

const newLines = lines.filter((line, index) => {
    const i = index + 1;
    if (i >= 91 && i <= 186) return false;
    if (i >= 192 && i <= 212) return false;
    return true;
});

fs.writeFileSync(file, newLines.join('\n'));
console.log('Modified mockData.ts successfully');
