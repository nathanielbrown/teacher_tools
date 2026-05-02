const fs = require('fs');
let content = fs.readFileSync('lint_results.json', 'utf8');
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}
const results = JSON.parse(content);

const ruleCounts = {};
const fileCounts = {};

results.forEach(file => {
  file.messages.forEach(msg => {
    const rule = msg.ruleId || 'fatal';
    ruleCounts[rule] = (ruleCounts[rule] || 0) + 1;
    fileCounts[file.filePath] = (fileCounts[file.filePath] || 0) + 1;
  });
});

console.log('--- Rule Counts ---');
Object.entries(ruleCounts).sort((a, b) => b[1] - a[1]).forEach(([rule, count]) => {
  console.log(`${rule}: ${count}`);
});

console.log('\n--- Top 10 Files with Issues ---');
Object.entries(fileCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([file, count]) => {
  console.log(`${file.split('\\').pop()}: ${count}`);
});
