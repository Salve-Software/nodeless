import type { Vfs } from '@/types/index.js';
import { join, resolve } from 'node:path';
import postcss from 'postcss';
import tailwind from 'tailwindcss';
import { NodelessProject } from '@/index.js';
import { readTree, VENDORED_PACKAGES } from '@example/read-project-files.js';

const REPO_ROOT = resolve(import.meta.dirname, '../..');
const SCANNED = /\.(?:tsx?|jsx?|html)$/;

const files = readTree(join(REPO_ROOT, 'example/tailwind'), '');

for (const name of VENDORED_PACKAGES) {
  Object.assign(
    files,
    readTree(join(REPO_ROOT, 'node_modules', name), `/node_modules/${name}`),
  );
}

// The whole point of the seam: Tailwind is a devDependency of this example, never of
// the library. It reads the sources straight out of the VFS it is handed.
const project = new NodelessProject({
  files,
  cssTransform: async ({ css, vfs }) => {
    const processed = await postcss([tailwind({ content: contentOf(vfs) })]).process(
      css,
      {
        from: undefined,
      },
    );

    return processed.css;
  },
});

const startedAt = Date.now();
const result = await project.build();

if (!result.ok) {
  console.error('build failed:');
  for (const error of result.errors) console.error(' ', error.text);
  process.exit(1);
}

const css = new TextDecoder().decode(result.files['bundle.css'] ?? new Uint8Array());
// Utilities Tailwind can only have produced by scanning the TSX out of the VFS.
// Written as the minifier leaves them, since the default build mode is production.
const expected = ['.flex', '.min-h-screen', '.tracking-tight', 'min-width:768px'];
const missing = expected.filter((utility) => !css.includes(utility));

console.log(`  bundle.css ${(css.length / 1024).toFixed(1)} kB`);
console.log(`  built in ${String(Date.now() - startedAt)} ms`);

if (missing.length > 0) {
  console.error(`tailwind did not emit: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('  tailwind utilities present, generated from the VFS sources');

function contentOf(vfs: Vfs): { raw: string; extension: string }[] {
  return vfs
    .paths()
    .filter((path) => path.startsWith('/src/') && SCANNED.test(path))
    .map((path) => ({
      raw: vfs.readText(path),
      extension: path.split('.').pop() ?? 'tsx',
    }));
}
