import type { Plugin } from '@/types/index.js';
import { describe, expect, it } from 'vitest';
import { PluginContainer } from '@/classes/plugin/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';

function containerFor(plugins: Plugin[]): PluginContainer {
  const vfs = new MemoryVfs({ files: { '/a.ts': 'source' } });

  return new PluginContainer({
    plugins,
    vfs,
    resolve: (source) => (vfs.exists(source) ? source : undefined),
  });
}

describe('resolveId', () => {
  it('stops at the first plugin that claims the module', async () => {
    const asked: string[] = [];
    const container = containerFor([
      {
        name: 'first',
        resolveId: () => {
          asked.push('first');
          return null;
        },
      },
      {
        name: 'second',
        resolveId: () => {
          asked.push('second');
          return '/second.ts';
        },
      },
      {
        name: 'third',
        resolveId: () => {
          asked.push('third');
          return '/third.ts';
        },
      },
    ]);

    expect(await container.resolveId('x', '/a.ts')).toEqual({
      id: '/second.ts',
      external: false,
    });
    expect(asked).toEqual(['first', 'second']);
  });

  it('is undefined when nobody claims it', async () => {
    expect(await containerFor([{ name: 'a' }]).resolveId('x', '/a.ts')).toBeUndefined();
  });

  it('respects the pre tier over declaration order', async () => {
    const container = containerFor([
      { name: 'normal', resolveId: () => '/normal.ts' },
      { name: 'pre', enforce: 'pre', resolveId: () => '/pre.ts' },
    ]);

    expect(await container.resolveId('x', '/a.ts')).toEqual({
      id: '/pre.ts',
      external: false,
    });
  });
});

describe('load', () => {
  it('stops at the first plugin that returns code', async () => {
    const container = containerFor([
      { name: 'a', load: () => null },
      { name: 'b', load: () => 'loaded' },
      { name: 'c', load: () => 'never' },
    ]);

    expect(await container.load('/a.ts')).toEqual({ code: 'loaded' });
  });
});

describe('transform', () => {
  it('is a pipeline: every plugin sees what the one before it produced', async () => {
    const container = containerFor([
      { name: 'a', transform: (code) => `${code}+a` },
      { name: 'b', transform: (code) => `${code}+b` },
    ]);

    expect(await container.transform('source', '/a.ts')).toEqual({ code: 'source+a+b' });
  });

  it('skips a plugin that returns null without breaking the chain', async () => {
    const container = containerFor([
      { name: 'a', transform: (code) => `${code}+a` },
      { name: 'b', transform: () => null },
      { name: 'c', transform: (code) => `${code}+c` },
    ]);

    expect(await container.transform('s', '/a.ts')).toEqual({ code: 's+a+c' });
  });

  it('is undefined when no plugin touched the module', async () => {
    const container = containerFor([{ name: 'a', transform: () => null }]);

    expect(await container.transform('s', '/a.ts')).toBeUndefined();
  });

  it('keeps the last loader a plugin asked for', async () => {
    const container = containerFor([
      { name: 'a', transform: (code) => ({ code, loader: 'css' }) },
      { name: 'b', transform: (code) => `${code}!` },
    ]);

    expect(await container.transform('s', '/a.ts')).toEqual({
      code: 's!',
      loader: 'css',
    });
  });

  it('awaits an async hook', async () => {
    const container = containerFor([
      { name: 'a', transform: async (code) => Promise.resolve(`${code}+async`) },
    ]);

    expect(await container.transform('s', '/a.ts')).toEqual({ code: 's+async' });
  });
});

describe('the context a hook is called with', () => {
  it('hands the plugin the VFS and resolution from where it stands', async () => {
    let seen: string | undefined;
    const container = containerFor([
      {
        name: 'a',
        transform(code) {
          seen = this.vfs.readText('/a.ts');

          return this.resolve('/a.ts', '/') === undefined ? null : code;
        },
      },
    ]);

    expect(await container.transform('s', '/a.ts')).toEqual({ code: 's' });
    expect(seen).toBe('source');
  });
});

describe('configResolved', () => {
  it('tells every plugin about the build before any module is read', async () => {
    const told: string[] = [];
    const container = containerFor([
      { name: 'a', configResolved: (config) => void told.push(`a:${config.mode}`) },
      { name: 'b', configResolved: (config) => void told.push(`b:${config.entry}`) },
    ]);

    await container.configResolved({
      root: '/',
      mode: 'production',
      entry: '/src/main.tsx',
      outdir: '/dist',
      env: {},
    });

    expect(told).toEqual(['a:production', 'b:/src/main.tsx']);
  });
});
