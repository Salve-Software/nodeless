import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { NodelessProject } from '@/index.js';
import { readProjectFiles } from '@example/read-project-files.js';

const OUT_DIR = resolve(import.meta.dirname, 'dist');
const SNAPSHOT_FILE = resolve(import.meta.dirname, '../browser/snapshot.json');
const BUDGET_MS = 500;

const project = new NodelessProject({ files: readProjectFiles() });

// The first call includes WASM startup; the second one is the number that counts.
await project.build();

const result = await project.build();

if (!result.ok) {
  console.error('build failed:');
  for (const error of result.errors) console.error(' ', formatMessage(error));
  process.exit(1);
}

rmSync(OUT_DIR, { recursive: true, force: true });

for (const [name, bytes] of Object.entries(result.files)) {
  const target = join(OUT_DIR, name);

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes);
  console.log(`  ${name.padEnd(14)} ${formatSize(bytes.length)}`);
}

for (const warning of result.warnings) console.warn('  warning:', formatMessage(warning));

// The same snapshot an API would ship to the front end. `example/browser` feeds on it.
mkdirSync(dirname(SNAPSHOT_FILE), { recursive: true });
writeFileSync(SNAPSHOT_FILE, JSON.stringify(project.snapshot()));

console.log(`\ndist at ${OUT_DIR}`);
console.log(`snapshot at ${SNAPSHOT_FILE}`);
console.log(
  `warm build: ${String(result.durationMs)} ms (budget ${String(BUDGET_MS)} ms)`,
);

if (result.durationMs > BUDGET_MS) {
  console.error(`warm build went over the ${String(BUDGET_MS)} ms budget`);
  process.exit(1);
}

function formatSize(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} kB`;
}

function formatMessage({
  text,
  file,
  line,
}: {
  text: string;
  file?: string;
  line?: number;
}): string {
  return file ? `${file}:${String(line ?? 0)} ${text}` : text;
}
