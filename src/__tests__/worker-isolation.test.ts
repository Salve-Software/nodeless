import type { BuildResult, FileInput } from '@/types/index.js';
import { describe, expect, it } from 'vitest';
import { NodeResolver } from '@/classes/resolver/index.js';
import { WorkerRuntime } from '@/classes/runtime/index.js';
import { RUNTIME_CONDITIONS } from '@/classes/runtime/module-runtime/constants/index.js';
import { inProcessChannel } from '@/classes/runtime/worker-runtime/__tests__/in-process-channel.js';
import { MemoryVfs } from '@/classes/vfs/index.js';
import { NodelessProject } from '@/index.js';
import { bytesToText } from '@/library/index.js';

/** The facade with the worker half in this thread: same protocol, no browser needed. */
function projectWith(files: FileInput): NodelessProject {
  const vfs = new MemoryVfs({ files });

  return new NodelessProject({
    vfs,
    runtime: new WorkerRuntime({
      vfs,
      resolver: new NodeResolver({ vfs, conditions: RUNTIME_CONDITIONS }),
      conditions: RUNTIME_CONDITIONS,
      channel: inProcessChannel,
    }),
  });
}

function text(result: BuildResult, name = 'bundle.js'): string {
  if (!result.ok) throw new Error(result.errors.map((error) => error.text).join(' | '));

  return bytesToText(result.files[name] ?? new Uint8Array());
}

describe('a config evaluated across the channel', () => {
  it('runs a transform hook against the app graph', async () => {
    const project = projectWith({
      '/src/main.ts': 'export const greeting = "REPLACE_ME";',
      '/vite.config.js': `export default { plugins: [{
        name: 'shout',
        transform: (code, id) => id.endsWith('main.ts') ? code.replace('REPLACE_ME', 'from a worker') : null,
      }] };`,
    });

    expect(text(await project.build())).toContain('from a worker');
  });

  it('stands up a virtual module through resolveId and load', async () => {
    const project = projectWith({
      '/src/main.ts': "export { version } from 'virtual:build-info';",
      '/vite.config.js': `export default { plugins: [{
        name: 'virtual',
        resolveId: (source) => source === 'virtual:build-info' ? '/virtual/build-info.js' : null,
        load: (id) => id === '/virtual/build-info.js' ? 'export const version = "1.2.3";' : null,
      }] };`,
    });

    expect(text(await project.build())).toContain('1.2.3');
  });

  it('applies define and aliases, which cross as plain data', async () => {
    const project = projectWith({
      '/src/main.ts':
        "export { value } from '~lib/value.js';\nexport const flag = __FEATURE__;",
      '/src/lib/value.js': 'export const value = "aliased";',
      '/vite.config.js': `export default {
        define: { __FEATURE__: JSON.stringify('on') },
        resolve: { alias: { '~lib': '/src/lib' } },
      };`,
    });
    const bundle = text(await project.build());

    expect(bundle).toContain('aliased');
    expect(bundle).toContain('on');
  });

  it('carries the plugins a config function returned, not just a config object', async () => {
    const project = projectWith({
      '/src/main.ts':
        "export { version } from 'virtual:build-info';\nexport const m = __MODE__;",
      '/vite.config.js': `export default ({ mode }) => ({
        define: { __MODE__: JSON.stringify(mode) },
        plugins: [{
          name: 'virtual',
          resolveId: (source) => source === 'virtual:build-info' ? '/virtual/build-info.js' : null,
          load: (id) => id === '/virtual/build-info.js' ? 'export const version = "1.2.3";' : null,
        }],
      });`,
    });
    const bundle = text(await project.build({ mode: 'development' }));

    expect(bundle).toContain('1.2.3');
    expect(bundle).toContain('development');
  });

  it('reads the VFS from inside the hook, after the sources changed', async () => {
    const project = projectWith({
      '/src/main.ts': 'export const x = "before";',
      '/vite.config.js': `export default { plugins: [{
        name: 'inline',
        transform(code, id) {
          return id.endsWith('main.ts')
            ? code.replace('before', this.vfs.readText('/src/replacement.txt'))
            : null;
        },
      }] };`,
    });

    project.vfs.writeFile('/src/replacement.txt', 'written after the worker started');

    expect(text(await project.build())).toContain('written after the worker started');
  });
});
