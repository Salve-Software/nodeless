import { describe, expect, it, vi } from 'vitest';
import { loadFromVfs } from '@/classes/bundler/esbuild-bundler/library/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';
import { bytesToText } from '@/library/index.js';

const files = {
  '/src/a.css': 'body { color: red; }',
  '/src/a.module.css': '.x { color: red; }',
  '/src/a.ts': 'export const x = 1;',
};

function contentsOf(result: { contents?: string | Uint8Array }): string {
  const { contents } = result;

  return typeof contents === 'string'
    ? contents
    : bytesToText(contents ?? new Uint8Array());
}

describe('loadFromVfs', () => {
  it('reads the file and picks its loader', async () => {
    const result = await loadFromVfs({ vfs: new MemoryVfs({ files }) }, '/src/a.ts');

    expect(result.loader).toBe('ts');
    expect(contentsOf(result)).toBe('export const x = 1;');
    expect(result.resolveDir).toBe('/src');
  });

  it('runs the css transform over a stylesheet', async () => {
    const cssTransform = vi.fn(({ css }: { css: string }) => css.replace('red', 'blue'));
    const vfs = new MemoryVfs({ files });
    const result = await loadFromVfs({ vfs, cssTransform }, '/src/a.css');

    expect(contentsOf(result)).toBe('body { color: blue; }');
    expect(cssTransform).toHaveBeenCalledWith({
      path: '/src/a.css',
      css: 'body { color: red; }',
      vfs,
    });
  });

  // Tailwind scans the sources for class names, so it needs more than the stylesheet.
  it('hands the transform the whole vfs', async () => {
    const result = await loadFromVfs(
      {
        vfs: new MemoryVfs({ files }),
        cssTransform: ({ vfs }) => `/* ${String(vfs.paths().length)} files */`,
      },
      '/src/a.css',
    );

    expect(contentsOf(result)).toBe('/* 3 files */');
  });

  // Tailwind on a CSS module is ordinary; the transform has to run before scoping.
  it('runs the css transform over a css module too', async () => {
    const result = await loadFromVfs(
      { vfs: new MemoryVfs({ files }), cssTransform: () => '.x { color: blue; }' },
      '/src/a.module.css',
    );

    expect(result.loader).toBe('local-css');
    expect(contentsOf(result)).toBe('.x { color: blue; }');
  });

  it('leaves everything that is not a stylesheet alone', async () => {
    const cssTransform = vi.fn(() => 'never');

    await loadFromVfs({ vfs: new MemoryVfs({ files }), cssTransform }, '/src/a.ts');

    expect(cssTransform).not.toHaveBeenCalled();
  });

  it('awaits an async transform', async () => {
    const result = await loadFromVfs(
      { vfs: new MemoryVfs({ files }), cssTransform: async () => 'done' },
      '/src/a.css',
    );

    expect(contentsOf(result)).toBe('done');
  });
});
