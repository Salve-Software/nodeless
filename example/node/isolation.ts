import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { NodelessProject } from '@/index.js';
import { createNodeChannel } from '@/node/index.js';

// The worker loads the built entry, which is why this runs after `npm run build`.
const WORKER_URL = pathToFileURL(
  resolve(import.meta.dirname, '../../dist/runtime-worker.js'),
).href;

process.env['API_DB_PASSWORD'] = 'hunter2';

/**
 * Runs a probe inside the project's own config and reports what it saw. `Function('return
 * this')()` is in most of them on purpose: shadowing a name is a speed bump, and that one
 * line walks around it, which is the whole reason a second realm is the only real answer.
 */
async function probe(body: string, isolation: 'none' | 'worker'): Promise<string> {
  const project = new NodelessProject({
    files: {
      '/src/main.ts': 'export const x = __SEEN__;',
      '/vite.config.js': `export default async () => {
        let seen;
        try { seen = String(await (async () => { ${body} })()); }
        catch (error) { seen = 'blocked'; }
        return { define: { __SEEN__: JSON.stringify(seen) } };
      };`,
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

const HOST = "Function('return this')()";
const probes = [
  {
    label: 'read the API env',
    body: `const g = ${HOST}; return g.process?.env?.API_DB_PASSWORD ?? 'blocked';`,
    reached: 'hunter2',
  },
  {
    label: 'count the API env',
    body: `const g = ${HOST}; return Object.keys(g.process?.env ?? {}).length + ' keys';`,
    reached: undefined,
  },
  {
    label: 'get a native fs binding',
    body: `const g = ${HOST}; return g.process.binding('fs') ? 'reached' : 'blocked';`,
    reached: 'reached',
  },
  {
    label: 'get a way to spawn',
    body: `const g = ${HOST}; return g.process.binding('spawn_sync') ? 'reached' : 'blocked';`,
    reached: 'reached',
  },
  {
    label: 'kill the host process',
    body: `const g = ${HOST}; return typeof g.process.kill === 'function' ? 'reached' : 'blocked';`,
    reached: 'reached',
  },
];

console.log("  what a project's own config can reach of the process building it\n");
console.log(`  ${'probe'.padEnd(24)} ${'isolation: none'.padEnd(18)} isolation: worker`);
console.log(`  ${'-'.repeat(24)} ${'-'.repeat(18)} ${'-'.repeat(18)}`);

const failures: string[] = [];

for (const { label, body, reached } of probes) {
  const open = await probe(body, 'none');
  const sealed = await probe(body, 'worker');

  console.log(`  ${label.padEnd(24)} ${open.padEnd(18)} ${sealed}`);

  if (sealed === 'reached' || sealed === 'hunter2') {
    failures.push(`the worker did not block "${label}"`);
  }
  // A probe that stops reproducing in-process proves nothing about the worker either.
  if (reached !== undefined && open !== reached) {
    failures.push(`"${label}" no longer reproduces in-process, so it guards nothing`);
  }
}

// Isolation has to be an option, not a fork: both modes must build the same thing.
const [open, sealed] = await Promise.all([
  probe("return 'same either way';", 'none'),
  probe("return 'same either way';", 'worker'),
]);

if (open !== sealed) failures.push(`the modes disagreed: "${open}" and "${sealed}"`);

console.log();

if (failures.length > 0) {
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}

console.log('  ✓ every probe that reaches the host in-process is blocked in the worker');
console.log('  ✓ both modes build the same bundle');
