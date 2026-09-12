import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { NodelessProject } from '@/index.js';
import { createNodeChannel } from '@/node/index.js';

// The worker loads the built entry, which is why this runs after `npm run build`.
const WORKER_URL = pathToFileURL(
  resolve(import.meta.dirname, '../../dist/runtime-worker.js'),
).href;

process.env['API_DB_PASSWORD'] = 'hunter2';
process.env['API_STRIPE_KEY'] = 'sk_live_do_not_leak';

/** What the project's own config managed to see, as the literal `define` put in the bundle. */
async function sawInConfig(
  expression: string,
  isolation: 'none' | 'worker',
): Promise<string> {
  const project = new NodelessProject({
    files: {
      '/src/main.ts': 'export const x = __SEEN__;',
      '/vite.config.js': `export default { define: { __SEEN__: JSON.stringify(${expression}) } };`,
    },
    isolation,
    ...(isolation === 'worker'
      ? { channel: () => createNodeChannel({ workerUrl: WORKER_URL }) }
      : {}),
  });
  const result = await project.build();

  await project.dispose();

  if (!result.ok) {
    console.error(result.errors.map((error) => error.text).join('\n'));
    process.exit(1);
  }

  const bundle = new TextDecoder().decode(result.files['bundle.js'] ?? new Uint8Array());

  return /"([^"]*)"/.exec(bundle)?.[1] ?? '(nothing)';
}

const probes = [
  [
    'the API env, through globalThis',
    "globalThis.process?.env?.API_DB_PASSWORD ?? 'not visible'",
  ],
  [
    'the API env, as keys',
    "String(Object.keys(globalThis.process?.env ?? {}).length) + ' keys'",
  ],
  ['the working directory', "globalThis.process?.cwd?.() ?? 'no process'"],
] as const;

console.log('  what the project config can see of the API process\n');
console.log(`  ${'probe'.padEnd(34)} ${'isolation: none'.padEnd(24)} isolation: worker`);
console.log(`  ${'-'.repeat(34)} ${'-'.repeat(24)} ${'-'.repeat(24)}`);

const results: { label: string; open: string; sealed: string }[] = [];

for (const [label, expression] of probes) {
  const open = await sawInConfig(expression, 'none');
  const sealed = await sawInConfig(expression, 'worker');

  results.push({ label, open, sealed });
  console.log(
    `  ${label.padEnd(34)} ${open.slice(0, 23).padEnd(24)} ${sealed.slice(0, 24)}`,
  );
}

// A build has to produce the same thing either way, or isolation is not an option but a fork.
const open = await sawInConfig("'same either way'", 'none');
const sealed = await sawInConfig("'same either way'", 'worker');

console.log();

if (open !== sealed) {
  console.error(`the two modes built different results: "${open}" and "${sealed}"`);
  process.exit(1);
}

const leaked = results.filter(({ sealed: value }) => value.includes('hunter2'));

if (leaked.length > 0) {
  console.error(`the worker leaked: ${leaked.map(({ label }) => label).join(', ')}`);
  process.exit(1);
}
if (!results[0] || results[0].open !== 'hunter2') {
  console.error('the in-process probe did not reproduce the leak it is there to show');
  process.exit(1);
}

console.log('  ✓ the API env is reachable in-process and not from the worker thread');
console.log('  ✓ both modes build the same bundle');
