const fs = require('fs');
const path = require('path');

const i18nDir = path.join(__dirname, 'src', 'i18n');
const enPath = path.join(i18nDir, 'en.json');
const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const enKeys = Object.keys(enContent);

const locales = ['zh', 'fr', 'th', 'vi', 'ja'];

locales.forEach(locale => {
  const localePath = path.join(i18nDir, `${locale}.json`);
  if (!fs.existsSync(localePath)) return;
  
  const content = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  const missing = enKeys.filter(key => !content.hasOwnProperty(key));
  
  if (missing.length > 0) {
    console.log(`\nLocale: ${locale}`);
    missing.forEach(key => {
      console.log(`"${key}": "${enContent[key]}",`);
    });
  }
});
