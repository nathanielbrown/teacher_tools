const fs = require('fs');
const path = require('path');

const toolsDir = path.join(__dirname, 'src', 'components', 'tools');
const files = fs.readdirSync(toolsDir);

files.forEach(file => {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(toolsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('localStorage')) {
      // Add import if not present
      if (!content.includes("import { storage } from '../../utils/storage';")) {
        const lines = content.split('\n');
        // Find last import
        let lastImportIndex = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
            lastImportIndex = i;
          }
        }
        lines.splice(lastImportIndex + 1, 0, "import { storage } from '../../utils/storage';");
        content = lines.join('\n');
      }
      
      // Replace localStorage with storage
      // careful to avoid replacing 'window.localStorage' if it's there
      content = content.replace(/window\.localStorage/g, 'storage');
      content = content.replace(/\blocalStorage\b/g, 'storage');
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
});

// Also fix App.tsx which has some localStorage
const appPath = path.join(__dirname, 'src', 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');
if (appContent.includes('localStorage')) {
  if (!appContent.includes("import { storage } from './utils/storage';")) {
    const lines = appContent.split('\n');
    let lastImportIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    lines.splice(lastImportIndex + 1, 0, "import { storage } from './utils/storage';");
    appContent = lines.join('\n');
  }
  appContent = appContent.replace(/window\.localStorage/g, 'storage');
  appContent = appContent.replace(/\blocalStorage\b/g, 'storage');
  fs.writeFileSync(appPath, appContent, 'utf8');
  console.log(`Updated App.tsx`);
}
