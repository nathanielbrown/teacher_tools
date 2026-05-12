const fs = require('fs');
const path = require('path');

const i18nDir = path.join(__dirname, 'src', 'i18n');
const srcDir = path.join(__dirname, 'src');

/**
 * Patterns that represent dynamic key construction in the codebase.
 * These keys are used by concatenating strings or using template literals.
 */
const dynamicPatterns = [
  /^tool\.[a-z0-9]+\.name$/,             // `tool.${id}.name`
  /^dashboard\.subsection\.[a-z]+$/,     // `dashboard.subsection.${name...}`
  /^dashboard\.section\.[a-z]+\.title$/, // `dashboard.section.${activeTab...}.title`
  /^clock\.number\.\d+$/,                // `clock.number.${m}` or `clock.number.${remaining}`
  /^clock\.words\..+$/,                  // `clock.words.oclock`, `clock.words.past.singular` etc
  /^eventcalendar\.topic\..+$/,          // Dynamic calendar topics
  /^settings\.language\.[a-z]{2}$/,       // `settings.language.${id}`
  /^colourHunt\.color\.[a-z]+$/,         // `colourHunt.color.${targetColor.name.toLowerCase()}`
  /^guessingGame\.topic\.[a-z]+$/        // `guessingGame.topic.${topic.id}`
];

function isDynamic(key) {
  return dynamicPatterns.some(pattern => pattern.test(key));
}

function getKeysFromEn() {
  const enPath = path.join(i18nDir, 'en.json');
  if (!fs.existsSync(enPath)) return [];
  const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  return Object.keys(enContent);
}

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

function findUnusedKeys() {
  const keys = getKeysFromEn();
  const files = getAllFiles(srcDir);
  
  const unusedKeys = [];
  const dynamicKeys = [];
  
  // Read all files once for performance
  const fileContents = files.map(file => fs.readFileSync(file, 'utf8'));

  keys.forEach(key => {
    // If it matches a known dynamic pattern, we assume it's used
    if (isDynamic(key)) {
      dynamicKeys.push(key);
      return;
    }

    let found = false;
    // Check for the key wrapped in quotes/backticks or as an object property
    const regexps = [
      new RegExp(`['"\`]${key.replace(/\./g, '\\.')}['"\`]`),
      new RegExp(`id: ['"\`]${key.replace(/\./g, '\\.')}['"\`]`),
      new RegExp(`id=['"\`]${key.replace(/\./g, '\\.')}['"\`]`)
    ];

    for (let content of fileContents) {
      if (regexps.some(re => re.test(content))) {
        found = true;
        break;
      }
    }
    
    if (!found) {
      unusedKeys.push(key);
    }
  });

  return {
    totalChecked: keys.length,
    unused: unusedKeys,
    dynamicAssumedUsed: dynamicKeys.length
  };
}

// If run directly
if (require.main === module) {
  const results = findUnusedKeys();
  console.log(`\nChecked ${results.totalChecked} keys.`);
  console.log(`Assumed ${results.dynamicAssumedUsed} keys are used dynamically (ignored).`);
  console.log(`Found ${results.unused.length} potentially unused keys:`);
  results.unused.forEach(k => console.log(` - ${k}`));
  console.log('\n');
}

module.exports = { findUnusedKeys };
