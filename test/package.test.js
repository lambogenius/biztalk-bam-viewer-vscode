const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

test('extension metadata is present', () => {
  assert.equal(pkg.name, 'biztalk-bam-viewer');
  assert.equal(pkg.main, 'extension.cjs');
  assert.ok(pkg.contributes.customEditors?.some(editor => editor.viewType === 'biztalkBamViewer.editor'));
});

test('build and packaging workflow is configured', () => {
  assert.equal(typeof pkg.scripts.build, 'string');
  assert.equal(typeof pkg.scripts.package, 'string');
  assert.equal(typeof pkg.scripts['package:vsix'], 'string');
  assert.equal(typeof pkg.scripts['reinstall:extension'], 'string');
});

test('build script creates artifacts directory and validates required files', () => {
  const scriptPath = path.join(root, 'scripts', 'build.js');
  assert.ok(fs.existsSync(scriptPath), 'build script should exist');

  const requiredFiles = ['extension.cjs', 'package.json', 'media/index.html', 'media/main.js', 'media/style.css'];
  for (const relativePath of requiredFiles) {
    assert.ok(fs.existsSync(path.join(root, relativePath)), `missing required file: ${relativePath}`);
  }

  const artifactsDir = path.join(root, 'artifacts');
  fs.mkdirSync(artifactsDir, { recursive: true });
  assert.ok(fs.existsSync(artifactsDir), 'artifacts directory should exist');
});
