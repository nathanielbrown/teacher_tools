const fs = require('fs');
let content = fs.readFileSync('src/data/wordLists.js', 'utf8');

// Update YEAR_LEVELS
content = content.replace(/export const YEAR_LEVELS = \[1, 2, 3, 4, 5, 6, 7, 8, 9, 10\];/, 'export const YEAR_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8];');

// Fix the RECOMMENDED_DATA whitespace if needed
content = content.replace(/\};\s*export const YEAR_LEVELS/, '};\n\nexport const YEAR_LEVELS');

fs.writeFileSync('src/data/wordLists.js', content);
console.log('Successfully updated YEAR_LEVELS');
