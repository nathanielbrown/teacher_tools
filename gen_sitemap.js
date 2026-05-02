import fs from 'fs';

const content = fs.readFileSync('./src/data/tools.tsx', 'utf-8');
let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://beta.classrex.com/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

// Match tool objects to extract id, section, and check for hidden status
const toolRegex = /\{\s*id:\s*['"]([a-z0-9]+)['"][\s\S]*?mainSection:\s*['"]([^'"]+)['"][\s\S]*?\}/g;

const seenIds = new Set();
let match;
while ((match = toolRegex.exec(content)) !== null) {
  const block = match[0];
  if (block.includes('hidden: true')) continue;
  
  const id = match[1];
  const section = match[2];
  
  if (!seenIds.has(id)) {
    seenIds.add(id);
    const tabPath = section.replace(/\s+/g, '');
    xml += `  <url>\n    <loc>https://beta.classrex.com/${tabPath}/${id}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }
}

// Add the base paths for tabs
xml += `  <url>\n    <loc>https://beta.classrex.com/TeacherTools</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
xml += `  <url>\n    <loc>https://beta.classrex.com/StudentTools</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
xml += `  <url>\n    <loc>https://beta.classrex.com/ClassroomGames</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
xml += `  <url>\n    <loc>https://beta.classrex.com/config</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
xml += `  <url>\n    <loc>https://beta.classrex.com/config/classes</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
xml += `  <url>\n    <loc>https://beta.classrex.com/config/wordmanager</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;

xml += `</urlset>`;
fs.writeFileSync('./public/sitemap.xml', xml);
console.log(`Sitemap generated with ${seenIds.size} tools.`);
