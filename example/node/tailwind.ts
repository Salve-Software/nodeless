import { join, resolve } from 'node:path';
import { NodelessProject } from '@/index.js';
import { readTree, VENDORED_PACKAGES } from '@example/read-project-files.js';

const REPO_ROOT = resolve(import.meta.dirname, '../..');

const files = readTree(join(REPO_ROOT, 'example/tailwind'), '');

// Tailwind has to be in the VFS like any other dependency: nodeless runs the engine from
// its own peer, but reads the stylesheets out of the project.
for (const name of [...VENDORED_PACKAGES, 'tailwindcss']) {
  Object.assign(
    files,
    readTree(join(REPO_ROOT, 'node_modules', name), `/node_modules/${name}`),
  );
}

// No options at all. The project uses Tailwind, so the build uses Tailwind.
const project = new NodelessProject({ files });

const startedAt = Date.now();
const result = await project.build();

if (!result.ok) {
  console.error('build failed:');
  for (const error of result.errors) console.error(' ', error.text);
  process.exit(1);
}

const css = new TextDecoder().decode(result.files['bundle.css'] ?? new Uint8Array());
// Utilities Tailwind can only have produced by scanning the TSX out of the VFS, plus one
// from @theme and one from @layer, which are v4 directives and not plain CSS. v4 emits
// responsive variants as `@media (width >= 48rem)`, not the v3 min-width form.
const expected = ['.flex', '.min-h-screen', '48rem', '--color-brand', '.panel'];
const missing = expected.filter((utility) => !css.includes(utility));

console.log(`  bundle.css ${(css.length / 1024).toFixed(1)} kB`);
console.log(`  built in ${String(Date.now() - startedAt)} ms`);

if (missing.length > 0) {
  console.error(`tailwind did not emit: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('  tailwind v4 ran with no configuration at all');
