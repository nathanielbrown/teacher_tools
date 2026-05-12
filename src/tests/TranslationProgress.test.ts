import { describe, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { findUnusedKeys } from '../../find_unused_keys.cjs';

describe('Translation Status', () => {
  const i18nDir = path.resolve(__dirname, '../i18n');
  const enPath = path.join(i18nDir, 'en.json');
  
  if (!fs.existsSync(enPath)) {
    throw new Error('Reference translation file en.json not found');
  }

  const enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
  const enKeys = Object.keys(enData);
  const totalKeys = enKeys.length;

  const files = fs.readdirSync(i18nDir).filter(f => f.endsWith('.json') && f !== 'en.json');

  it('reports translation progress and potential orphans', () => {
    console.log(`\nTranslation Progress (Reference: English - ${totalKeys} keys)`);
    console.log('--------------------------------------------------');

    files.forEach(file => {
      const filePath = path.join(i18nDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      const translatedKeys = enKeys.filter(key => {
        const val = data[key];
        return val !== undefined && val !== null && val !== '';
      }).length;

      const percentage = ((translatedKeys / totalKeys) * 100).toFixed(1);
      const extraKeys = Object.keys(data).filter(key => !enData[key]).length;
      
      let status = '';
      if (parseFloat(percentage) === 100) status = '✅';
      else if (parseFloat(percentage) > 80) status = '🟡';
      else status = '🔴';

      console.log(`${status} ${file.replace('.json', '').toUpperCase().padEnd(5)}: ${percentage.padStart(5)}% (${translatedKeys}/${totalKeys}) ${extraKeys > 0 ? `[+${extraKeys} extra]` : ''}`);
    });
    
    // Add Unused Keys Report
    const unusedResults = findUnusedKeys();
    console.log('--------------------------------------------------');
    console.log(`🧹 Potential Orphans (Not found in source code)`);
    console.log(`   Count: ${unusedResults.unused.length} keys`);
    console.log(`   Note: Ignored ${unusedResults.dynamicAssumedUsed} dynamic patterns`);
    
    if (unusedResults.unused.length > 0) {
      console.log('   Samples:');
      unusedResults.unused.slice(0, 5).forEach(k => console.log(`    - ${k}`));
      if (unusedResults.unused.length > 5) console.log(`    ... and ${unusedResults.unused.length - 5} more.`);
    }
    console.log('--------------------------------------------------\n');
  });
});
