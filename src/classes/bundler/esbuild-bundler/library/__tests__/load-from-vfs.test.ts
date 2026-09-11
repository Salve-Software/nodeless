import type { Plugin, Vfs } from '@/types/index.js';
import { describe, expect, it } from 'vitest';
import { loadFromVfs } from '@/classes/bundler/esbuild-bundler/library/index.js';
import { PluginContainer } from '@/classes/plugin/index.js';
import { NodeResolver } from '@/classes/resolver/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';
import { bytesToText } from '@/library/index.js';

const files = {
  '/src/app.css': '.a { color: red; }',
  '/src/main.ts': 'export const x = 1;',
  '/src/logo.svg': '<svg />',
  '/src/data.json': '{"a":1}',
};

function load(path: string, plugins: Plugin[] = []) {
  const vfs: Vfs = new MemoryVfs({ files });
  const resolver = new NodeResolver({ vfs });
  const container = new PluginContainer({
    vfs,
    plugins,
    resolve: (source, importer) => {
      try {
        const found = resolver.resolve({ specifier: source, importer });

        return found.kind === 'file' ? found.path : undefined;
      } catch {
        return undefined;
      }
    },
  });

  return loadFromVfs({ vfs, container }, path);
}

function asText(contents: string | Uint8Array | undefined): string {
  return typeof contents === 'string'
    ? contents
    : bytesToText(contents ?? new Uint8Array());
}

describe('loadFromVfs without plugins', () => {
  it('reads the file and picks the loader from its extension', async () => {
    const result = await load('/src/main.ts');

    expect(result.loader).toBe('ts');
    expect(asText(result.contents)).toBe('export const x = 1;');
  });

  it('reports the containing directory, which esbuild needs to resolve from', async () => {
    expect((await load('/src/main.ts')).resolveDir).toBe('/src');
  });

  it('leaves an asset as bytes rather than decoding it', async () => {
    expect((await load('/src/logo.svg')).loader).toBe('dataurl');
  });
});

describe('loadFromVfs with plugins', () => {
  it('lets transform rewrite the file', async () => {
    const result = await load('/src/app.css', [
      { name: 'a', transform: (code) => code.replace('red', 'blue') },
    ]);

    expect(asText(result.contents)).toContain('blue');
  });

  it('lets a plugin change the loader, which is how scss becomes css', async () => {
    const result = await load('/src/main.ts', [
      { name: 'a', transform: (code) => ({ code, loader: 'css' }) },
    ]);

    expect(result.loader).toBe('css');
  });

  it('lets load replace the source before transform sees it', async () => {
    const result = await load('/src/main.ts', [
      { name: 'a', load: () => 'export const x = 2;' },
      { name: 'b', transform: (code) => code.replace('2', '3') },
    ]);

    expect(asText(result.contents)).toBe('export const x = 3;');
  });

  it('hands the plugin the whole VFS', async () => {
    let seen = '';

    await load('/src/main.ts', [
      {
        name: 'a',
        transform(code) {
          seen = this.vfs.readText('/src/app.css');

          return code;
        },
      },
    ]);

    expect(seen).toBe('.a { color: red; }');
  });

  it('hands the plugin a resolver rooted at the file', async () => {
    let seen: string | undefined;

    await load('/src/main.ts', [
      {
        name: 'a',
        transform(code, id) {
          seen = this.resolve('./app.css', id);

          return code;
        },
      },
    ]);

    expect(seen).toBe('/src/app.css');
  });

  it('resolving something that does not exist gives undefined, not a throw', async () => {
    let seen: string | undefined = 'unset';

    await load('/src/main.ts', [
      {
        name: 'a',
        transform(code, id) {
          seen = this.resolve('./gone.css', id);

          return code;
        },
      },
    ]);

    expect(seen).toBeUndefined();
  });

  it('leaves an asset alone: a plugin never sees binary content', async () => {
    let called = false;

    await load('/src/logo.svg', [
      {
        name: 'a',
        transform: (code) => {
          called = true;

          return code;
        },
      },
    ]);

    expect(called).toBe(false);
  });
});
