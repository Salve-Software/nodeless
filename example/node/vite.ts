import { join, resolve } from 'node:path';
import { NodelessProject } from '@/index.js';
import { readTree, VENDORED_PACKAGES } from '@example/read-project-files.js';

const REPO_ROOT = resolve(import.meta.dirname, '../..');

const files = readTree(join(REPO_ROOT, 'example/vite'), '');

for (const name of VENDORED_PACKAGES) {
  Object.assign(
    files,
    readTree(join(REPO_ROOT, 'node_modules', name), `/node_modules/${name}`),
  );
}

// No options at all. The project ships a vite.config.ts, so the build runs it.
const project = new NodelessProject({ files });

const startedAt = Date.now();
const result = await project.build({ mode: 'development' });

if (!result.ok) {
  console.error('build failed:');
  for (const error of result.errors) {
    console.error(
      ' ',
      error.file ? `${error.file}:${String(error.line ?? 0)}` : '',
      error.text,
    );
  }
  process.exit(1);
}

const bundle = new TextDecoder().decode(result.files['bundle.js'] ?? new Uint8Array());

// Each of these can only be in the bundle because the project's own config ran:
// a plugin that reads node:fs, a virtual module with no file behind it, a define,
// and an alias — none of which nodeless has any code for.
const expected = {
  'the banner plugin ran, reading node:fs': 'built by nodeless',
  'the virtual module was stood up': '1970-01-01T00:00:00.000Z',
  'define was applied': '"development"',
  'the ~ alias resolved': 'A Vite config, run by nodeless',
};
const missing = Object.entries(expected).filter(([, needle]) => !bundle.includes(needle));

console.log(`  bundle.js  ${(bundle.length / 1024).toFixed(1)} kB`);
console.log(`  built in ${String(Date.now() - startedAt)} ms`);

for (const [label] of Object.entries(expected)) {
  if (!missing.some(([candidate]) => candidate === label)) console.log(`  ✓ ${label}`);
}

if (missing.length > 0) {
  console.error('\nthe config did not take effect:');
  for (const [label] of missing) console.error(`  ✗ ${label}`);
  process.exit(1);
}

console.log('\n  a vite config ran, with no nodeless code for any of it');
