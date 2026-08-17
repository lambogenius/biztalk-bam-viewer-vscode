const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const artifactsDir = path.join(root, 'artifacts');
const requiredFiles = [
  'extension.cjs',
  'package.json',
  'README.md',
  'LICENSE',
  'media/index.html',
  'media/main.js',
  'media/style.css',
];

fs.mkdirSync(artifactsDir, { recursive: true });

for (const relativePath of requiredFiles) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Required file is missing: ${relativePath}`);
  }
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const packageName = manifest.name || 'biztalk-bam-viewer';
const packageVersion = manifest.version || '0.0.0';
const buildInfo = {
  generatedAt: new Date().toISOString(),
  packageName,
  packageVersion,
  files: requiredFiles,
};

fs.writeFileSync(path.join(artifactsDir, 'build-manifest.json'), JSON.stringify(buildInfo, null, 2));
console.log(`Build validated ${requiredFiles.length} extension files for ${packageName}@${packageVersion}.`);
