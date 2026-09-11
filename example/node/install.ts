import type { FileInput } from '@/types/index.js';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { NodelessProject } from '@/index.js';

const APP_DIR = resolve(import.meta.dirname, '../install');

const files = readTree(APP_DIR, '');
const declared = Object.keys(
  (
    JSON.parse(new TextDecoder().decode(files['/package.json'] as Uint8Array)) as {
      dependencies: Record<string, string>;
    }
  ).dependencies,
);
const project = new NodelessProject({ files });

console.log('installing from https://registry.npmjs.org …');

const installedAt = Date.now();
const install = await project.install();
const names = Object.keys(install.installed).sort();

console.log(
  `  ${String(names.length)} packages in ${String(Date.now() - installedAt)} ms`,
);
for (const name of names)
  console.log(`  ${name.padEnd(34)} ${install.installed[name] ?? ''}`);
for (const warning of install.warnings) console.warn(`  peer: ${warning}`);

const missing = declared.filter((name) => install.installed[name] === undefined);

if (missing.length > 0) {
  console.error(`declared but not installed: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('\nbuilding …');

const result = await project.build();

if (!result.ok) {
  console.error('build failed:');
  for (const error of result.errors) {
    console.error(`  ${error.file ?? '?'}:${String(error.line ?? 0)} ${error.text}`);
  }
  process.exit(1);
}

for (const warning of result.warnings) console.warn(`  warning: ${warning.text}`);

const bundle = result.files['bundle.js']?.length ?? 0;

console.log(
  `  bundle.js ${(bundle / 1024).toFixed(1)} kB in ${String(result.durationMs)} ms`,
);

if (bundle === 0) {
  console.error('bundle is empty');
  process.exit(1);
}

function readTree(dir: string, prefix: string): FileInput {
  const files: FileInput = {};

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const source = join(dir, entry.name);
    const target = `${prefix}/${entry.name}`;

    if (entry.isDirectory()) Object.assign(files, readTree(source, target));
    else if (entry.isFile()) files[target] = new Uint8Array(readFileSync(source));
  }

  return files;
}
