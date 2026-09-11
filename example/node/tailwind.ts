import type { Vfs } from '@/types/index.js';
import { join, resolve as resolvePath } from 'node:path';
import { compile } from 'tailwindcss';
import { NodelessProject } from '@/index.js';
import { readTree, VENDORED_PACKAGES } from '@example/read-project-files.js';

const REPO_ROOT = resolvePath(import.meta.dirname, '../..');
const SCANNED = /\.(?:tsx?|jsx?|html)$/;
// Tailwind's own scanner is a native Rust binary. Everything that could be a utility
// is fed in instead, and Tailwind drops whatever it does not recognise.
const CANDIDATE = /[^\s"'`<>{}()=;,]+/g;

const files = readTree(join(REPO_ROOT, 'example/tailwind'), '');

for (const name of VENDORED_PACKAGES) {
  Object.assign(
    files,
    readTree(join(REPO_ROOT, 'node_modules', name), `/node_modules/${name}`),
  );
}

Object.assign(
  files,
  readTree(join(REPO_ROOT, 'node_modules/tailwindcss'), '/node_modules/tailwindcss'),
);

// tailwindcss is a devDependency of this example, never of the library.
const project = new NodelessProject({
  files,
  cssTransform: async ({ path, css, vfs, resolve }) => {
    const compiler = await compile(css, {
      base: dirOf(path),
      loadStylesheet: async (id, base) => {
        const found = resolve(id) ?? join(base, id);

        return { path: found, base: dirOf(found), content: vfs.readText(found) };
      },
      loadModule: () => {
        throw new Error('@plugin and @config are not supported here');
      },
    });

    return compiler.build(candidatesIn(vfs));
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
// Utilities Tailwind can only have produced by scanning the TSX out of the VFS, plus
// one from @theme and one from @layer, which are v4 directives and not plain CSS.
// v4 emits responsive variants as `@media (width >= 48rem)`, not the v3 min-width form.
const expected = ['.flex', '.min-h-screen', '48rem', '--color-brand', '.panel'];
const missing = expected.filter((utility) => !css.includes(utility));

console.log(`  bundle.css ${(css.length / 1024).toFixed(1)} kB`);
console.log(`  built in ${String(Date.now() - startedAt)} ms`);

if (missing.length > 0) {
  console.error(`tailwind did not emit: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('  tailwind v4 utilities present, generated from the VFS sources');

function dirOf(path: string): string {
  return path.slice(0, path.lastIndexOf('/')) || '/';
}

function candidatesIn(vfs: Vfs): string[] {
  const found = new Set<string>();

  for (const path of vfs.paths()) {
    if (!path.startsWith('/src/') || !SCANNED.test(path)) continue;
    for (const token of vfs.readText(path).match(CANDIDATE) ?? []) found.add(token);
  }

  return [...found];
}
