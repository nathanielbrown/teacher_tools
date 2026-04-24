import fs from 'fs';

const packageJsonPath = './package.json';
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

let version = pkg.version;

if (/^\d+$/.test(version)) {
  // If version is just a number like "1000"
  pkg.version = (parseInt(version, 10) + 1).toString();
} else {
  // Try to bump the last part of a dot-separated version
  const parts = version.split('.');
  const lastPart = parts[parts.length - 1];
  if (!isNaN(lastPart)) {
    parts[parts.length - 1] = (parseInt(lastPart, 10) + 1).toString();
    pkg.version = parts.join('.');
  }
}

fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Bumped version to ${pkg.version}`);
