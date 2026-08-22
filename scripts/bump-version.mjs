import fs from 'node:fs';
import path from 'node:path';

const packageJsonPath = path.resolve(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const [major, minor, patch = 0] = (packageJson.version || '0.0.0')
  .split('.')
  .map(Number);

const nextVersion = `${major}.${minor}.${patch + 1}`;
packageJson.version = nextVersion;

fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
console.log(`Version bumped to ${nextVersion}`);
