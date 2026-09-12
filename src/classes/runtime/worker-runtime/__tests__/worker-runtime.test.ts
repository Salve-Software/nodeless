import type { Runtime } from '@/types/index.js';
import { describe, expect, it } from 'vitest';
import { NodeResolver } from '@/classes/resolver/index.js';
import { WorkerRuntime } from '@/classes/runtime/index.js';
import { RUNTIME_CONDITIONS } from '@/classes/runtime/module-runtime/constants/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';
import { inProcessChannel } from './in-process-channel.js';

function runtimeFor(files: Record<string, string>): { runtime: Runtime; vfs: MemoryVfs } {
  const vfs = new MemoryVfs({ files });
  const runtime = new WorkerRuntime({
    vfs,
    resolver: new NodeResolver({ vfs, conditions: RUNTIME_CONDITIONS }),
    conditions: RUNTIME_CONDITIONS,
    cwd: '/project',
    env: { NODE_ENV: 'test' },
    channel: inProcessChannel,
  });

  return { runtime, vfs };
}

describe('evaluating across the channel', () => {
  it('returns the data a module exported', async () => {
    const { runtime } = runtimeFor({
      '/project/config.js': `export default { name: 'app', count: 2 };`,
    });

    expect((await runtime.import('/project/config.js'))['default']).toEqual({
      name: 'app',
      count: 2,
    });
  });

  it('turns an exported function into a stub that runs on the other side', async () => {
    const { runtime } = runtimeFor({
      '/project/config.js': `export default (a, b) => a + b;`,
    });
    const add = (await runtime.import('/project/config.js'))['default'] as (
      a: number,
      b: number,
    ) => Promise<number>;

    await expect(add(2, 3)).resolves.toBe(5);
  });

  it('carries a config full of plugins, hooks and all', async () => {
    const { runtime } = runtimeFor({
      '/project/vite.config.js': `
        export default {
          plugins: [
            { name: 'shout', transform: (code, id) => id.endsWith('.ts') ? code + '!' : null },
          ],
        };
      `,
    });
    const config = (await runtime.import('/project/vite.config.js'))['default'] as {
      plugins: {
        name: string;
        transform: (code: string, id: string) => Promise<unknown>;
      }[];
    };

    expect(config.plugins[0]?.name).toBe('shout');
    await expect(config.plugins[0]?.transform('x', '/a.ts')).resolves.toBe('x!');
    await expect(config.plugins[0]?.transform('x', '/a.css')).resolves.toBeNull();
  });
});

describe('the filesystem on the other side', () => {
  it('is the VFS as it stood when the worker started', async () => {
    const { runtime } = runtimeFor({
      '/project/config.js': `import { readFileSync } from 'node:fs';
        export default readFileSync('/project/data.txt', 'utf8');`,
      '/project/data.txt': 'from the vfs',
    });

    expect((await runtime.import('/project/config.js'))['default']).toBe('from the vfs');
  });

  it('picks up a file written after the worker started', async () => {
    const { runtime, vfs } = runtimeFor({
      '/project/config.js': `export default { plugins: [{
        name: 'reader',
        transform() { return this.vfs.readText('/project/late.txt'); },
      }] };`,
    });
    const config = (await runtime.import('/project/config.js'))['default'] as {
      plugins: { transform: (code: string, id: string) => Promise<unknown> }[];
    };

    vfs.writeFile('/project/late.txt', 'written later');

    await expect(config.plugins[0]?.transform('x', '/a.ts')).resolves.toBe(
      'written later',
    );
  });

  it('gives a hook a resolver rooted on the other side', async () => {
    const { runtime } = runtimeFor({
      '/project/config.js': `export default { plugins: [{
        name: 'resolver',
        transform(code, id) { return this.resolve('./dep.js', id) ?? 'not found'; },
      }] };`,
      '/project/dep.js': 'export const x = 1;',
    });
    const config = (await runtime.import('/project/config.js'))['default'] as {
      plugins: { transform: (code: string, id: string) => Promise<unknown> }[];
    };

    await expect(config.plugins[0]?.transform('x', '/project/main.js')).resolves.toBe(
      '/project/dep.js',
    );
  });
});

describe('lifecycle', () => {
  it('evaluates a module once', async () => {
    const { runtime } = runtimeFor({
      '/project/config.js': `export default { id: Math.random() };`,
    });
    const [first, second] = await Promise.all([
      runtime.import('/project/config.js'),
      runtime.import('/project/config.js'),
    ]);

    expect(first['default']).toEqual(second['default']);
  });

  it('re-evaluates after invalidate', async () => {
    const { runtime, vfs } = runtimeFor({ '/project/config.js': `export default 1;` });

    expect((await runtime.import('/project/config.js'))['default']).toBe(1);

    vfs.writeFile('/project/config.js', `export default 2;`);
    runtime.invalidate?.();

    expect((await runtime.import('/project/config.js'))['default']).toBe(2);
  });

  it('reports a throw with the module named', async () => {
    const { runtime } = runtimeFor({ '/project/config.js': `throw new Error('boom');` });

    await expect(runtime.import('/project/config.js')).rejects.toThrowError(
      /Failed to run \/project\/config\.js: boom/,
    );
  });

  it('is done once disposed, rather than quietly starting a second worker', async () => {
    const { runtime } = runtimeFor({ '/project/config.js': `export default 1;` });

    await runtime.import('/project/config.js');
    await runtime.dispose();

    await expect(runtime.import('/project/config.js')).rejects.toThrowError(/disposed/);
  });
});
