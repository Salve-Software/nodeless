import type { SourceTransform, Vfs } from '@/types/index.js';
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

function options(extra: { transforms?: SourceTransform[]; assetLimit?: number } = {}) {
  const vfs: Vfs = new MemoryVfs({ files });

  return { vfs, resolver: new NodeResolver({ vfs }), ...extra };
}

function transform(apply: SourceTransform['apply']): SourceTransform {
  return { name: 'fake', matches: () => true, apply };
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

  it('lets a transform rewrite the file', async () => {
    const result = await loadFromVfs(
      options({
        transforms: [
          transform(async ({ content }) => ({ content: content.replace('red', 'blue') })),
        ],
      }),
      '/src/a.css',
    );

    expect(contentsOf(result)).toBe('body { color: blue; }');
  });

  it('a transform can change the loader, which is how scss becomes css', async () => {
    const result = await loadFromVfs(
      options({
        transforms: [transform(async () => ({ content: '.a{}', loader: 'css' }))],
      }),
      '/src/a.ts',
    );

    expect(result.loader).toBe('css');
  });

  // Tailwind scans the sources for class names, so it needs more than this one file.
  it('hands the transform the whole vfs', async () => {
    const result = await loadFromVfs(
      options({
        transforms: [
          transform(async ({ vfs }) => ({
            content: `/* ${String(vfs.paths().length)} */`,
          })),
        ],
      }),
      '/src/a.css',
    );

    expect(contentsOf(result)).toContain('/*');
  });

  // Without this a transform has to reimplement node resolution to find its own entry.
  it('hands the transform a resolver rooted at the file', async () => {
    const result = await loadFromVfs(
      options({
        transforms: [
          transform(async ({ resolve }) => ({
            content: `/* ${String(resolve('pkg'))} */`,
          })),
        ],
      }),
      '/src/a.css',
    );

    expect(contentsOf(result)).toBe('/* /node_modules/pkg/s.css */');
  });

  it('resolving something that does not exist gives undefined, not a throw', async () => {
    const result = await loadFromVfs(
      options({
        transforms: [
          transform(async ({ resolve }) => ({
            content: `/* ${String(resolve('gone'))} */`,
          })),
        ],
      }),
      '/src/a.css',
    );

    expect(contentsOf(result)).toBe('/* undefined */');
  });

  // Handing an image to a text transform would corrupt it.
  it('never offers an asset to a transform', async () => {
    const apply = vi.fn(async () => ({ content: 'never' }));

    await loadFromVfs(options({ transforms: [transform(apply)] }), '/src/small.png');

    expect(apply).not.toHaveBeenCalled();
  });

  it('no transform at all leaves the file alone', async () => {
    expect(contentsOf(await loadFromVfs(options(), '/src/a.css'))).toBe(
      'body { color: red; }',
    );
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
