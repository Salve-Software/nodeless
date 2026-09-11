import type { CssTransform, Vfs } from '@/types/index.js';
import { describe, expect, it, vi } from 'vitest';
import { loadFromVfs } from '@/classes/bundler/esbuild-bundler/library/index.js';
import { NodeResolver } from '@/classes/resolver/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';
import { bytesToText } from '@/library/index.js';

const files = {
  '/src/a.css': 'body { color: red; }',
  '/src/a.module.css': '.x { color: red; }',
  '/src/a.ts': 'export const x = 1;',
  '/src/small.png': new Uint8Array(10),
  '/src/large.png': new Uint8Array(9000),
  '/node_modules/pkg/package.json': '{"name":"pkg","exports":{".":{"style":"./s.css"}}}',
  '/node_modules/pkg/s.css': '.from-pkg {}',
};

function options(extra: { cssTransform?: CssTransform; assetLimit?: number } = {}) {
  const vfs: Vfs = new MemoryVfs({ files });

  return { vfs, resolver: new NodeResolver({ vfs }), ...extra };
}

function contentsOf(result: { contents?: string | Uint8Array }): string {
  const { contents } = result;

  return typeof contents === 'string'
    ? contents
    : bytesToText(contents ?? new Uint8Array());
}

describe('loadFromVfs', () => {
  it('reads the file and picks its loader', async () => {
    const result = await loadFromVfs(options(), '/src/a.ts');

    expect(result.loader).toBe('ts');
    expect(contentsOf(result)).toBe('export const x = 1;');
    expect(result.resolveDir).toBe('/src');
  });

  it('runs the css transform over a stylesheet', async () => {
    const cssTransform = vi.fn(({ css }: { css: string }) => css.replace('red', 'blue'));
    const result = await loadFromVfs(options({ cssTransform }), '/src/a.css');

    expect(contentsOf(result)).toBe('body { color: blue; }');
    expect(cssTransform).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/src/a.css', css: 'body { color: red; }' }),
    );
  });

  // Tailwind scans the sources for class names, so it needs more than this one file.
  it('hands the transform the whole vfs', async () => {
    const result = await loadFromVfs(
      options({ cssTransform: ({ vfs }) => `/* ${String(vfs.paths().length)} files */` }),
      '/src/a.css',
    );

    expect(contentsOf(result)).toContain('files */');
  });

  // Without this a transform has to reimplement node resolution to find its own entry.
  it('hands the transform a resolver rooted at the stylesheet', async () => {
    const result = await loadFromVfs(
      options({ cssTransform: ({ resolve }) => `/* ${String(resolve('pkg'))} */` }),
      '/src/a.css',
    );

    expect(contentsOf(result)).toBe('/* /node_modules/pkg/s.css */');
  });

  it('resolving something that does not exist gives undefined, not a throw', async () => {
    const result = await loadFromVfs(
      options({ cssTransform: ({ resolve }) => `/* ${String(resolve('gone'))} */` }),
      '/src/a.css',
    );

    expect(contentsOf(result)).toBe('/* undefined */');
  });

  it('runs the css transform over a css module too', async () => {
    const result = await loadFromVfs(
      options({ cssTransform: () => '.x { color: blue; }' }),
      '/src/a.module.css',
    );

    expect(result.loader).toBe('local-css');
    expect(contentsOf(result)).toBe('.x { color: blue; }');
  });

  it('leaves everything that is not a stylesheet alone', async () => {
    const cssTransform = vi.fn(() => 'never');

    await loadFromVfs(options({ cssTransform }), '/src/a.ts');

    expect(cssTransform).not.toHaveBeenCalled();
  });

  it('awaits an async transform', async () => {
    const result = await loadFromVfs(
      options({ cssTransform: async () => 'done' }),
      '/src/a.css',
    );

    expect(contentsOf(result)).toBe('done');
  });
});

describe('loadFromVfs, the asset limit', () => {
  // Defaulting to 0 here would quietly emit every asset as a file for anyone building
  // the plugin directly instead of going through the bundler.
  it('uses the same 4 kB default the bundler passes', async () => {
    expect((await loadFromVfs(options(), '/src/small.png')).loader).toBe('dataurl');
    expect((await loadFromVfs(options(), '/src/large.png')).loader).toBe('file');
  });

  it('an explicit limit wins', async () => {
    expect(
      (await loadFromVfs(options({ assetLimit: 100_000 }), '/src/large.png')).loader,
    ).toBe('dataurl');
  });
});
