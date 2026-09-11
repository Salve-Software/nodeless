import type { TransformInput, Vfs } from '@/types/index.js';
import { describe, expect, it } from 'vitest';
import { NodeResolver } from '@/classes/resolver/index.js';
import { SassTransform } from '@/classes/transform/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';

const files = {
  '/src/main.scss': "@use './mixins'; .a { color: mixins.$c; }",
  '/src/_mixins.scss': '$c: red;',
  '/src/old.sass': '.a\n  color: blue',
};

function input(path: string, vfs: Vfs = new MemoryVfs({ files })): TransformInput {
  const resolver = new NodeResolver({ vfs });

  return {
    path,
    content: vfs.readText(path),
    vfs,
    resolve: (specifier) => {
      try {
        const found = resolver.resolve({ specifier, importer: path });

        return found.kind === 'file' ? found.path : undefined;
      } catch {
        return undefined;
      }
    },
  };
}

describe('SassTransform', () => {
  it('claims .scss and .sass, and leaves plain css alone', () => {
    const transform = new SassTransform();

    expect(transform.matches({ path: '/a.scss', content: '' })).toBe(true);
    expect(transform.matches({ path: '/a.sass', content: '' })).toBe(true);
    expect(transform.matches({ path: '/a.css', content: '' })).toBe(false);
  });

  it('compiles scss to css', async () => {
    const result = await new SassTransform().apply(input('/src/main.scss'));

    expect(result.content).toContain('color: red');
    expect(result.loader).toBe('css');
  });

  // `@use './mixins'` is stored as `_mixins.scss`, which only a VFS-aware importer finds.
  it('resolves a partial out of the VFS', async () => {
    const result = await new SassTransform().apply(input('/src/main.scss'));

    expect(result.content).not.toContain('@use');
  });

  it('reads the indented syntax from a .sass file', async () => {
    const result = await new SassTransform().apply(input('/src/old.sass'));

    expect(result.content).toContain('color: blue');
  });
});
