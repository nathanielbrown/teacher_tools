const fs = require('fs');
const content = fs.readFileSync('src/data/wordLists.js', 'utf8').split('\n');
const startIndex = content.findIndex(l => l.includes('export const BOGGLE_LOOKUP_LIST = ['));
const endIndex = content.findIndex((l, i) => i > startIndex && l.trim() === '];');

if (startIndex !== -1 && endIndex !== -1) {
    const list = content.slice(startIndex + 1, endIndex)
        .map(l => l.trim().replace(/['",]/g, ''))
        .filter(Boolean);
    const joined = "export const BOGGLE_LOOKUP_LIST = ['" + list.join("','") + "'];";
    content.splice(startIndex, endIndex - startIndex + 1, joined);
    fs.writeFileSync('src/data/wordLists.js', content.join('\n'));
    console.log('Successfully reformatted BOGGLE_LOOKUP_LIST');
} else {
    console.error('Could not find BOGGLE_LOOKUP_LIST bounds');
}
