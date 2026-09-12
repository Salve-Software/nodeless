import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as esbuild from 'esbuild-wasm';

// The worker entry has to be self-contained: a blob Worker inherits no import map, so the
// `resolve.exports` and `semver` the resolver needs would not resolve inside it.
const ENTRY = resolve(import.meta.dirname, '../dist/runtime-worker.js');

await esbuild.initialize({});

const result = await esbuild.build({
  stdin: {
    contents: readFileSync(ENTRY, 'utf8'),
    resolveDir: resolve(import.meta.dirname, '../dist'),
    sourcefile: 'runtime-worker.js',
    loader: 'js',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  legalComments: 'none',
  logLevel: 'warning',
});

const output = result.outputFiles?.[0]?.text;

if (output === undefined) {
  console.error('the worker bundle emitted nothing');
  process.exit(1);
}

writeFileSync(ENTRY, output);

const bare = [...output.matchAll(/^import [^(]*from ["']([^."'][^"']*)["']/gm)].map(
  (match) => match[1],
);

if (bare.length > 0) {
  console.error(`the worker bundle is not self-contained: ${bare.join(', ')}`);
  process.exit(1);
}

console.log(
  `  dist/runtime-worker.js  ${(output.length / 1024).toFixed(1)} kB, 0 bare imports`,
);
