import { describe, expect, it } from 'vitest';
import { resolveEntry } from '@/classes/bundler/esbuild-bundler/library/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';

describe('resolveEntry', () => {
  it('an explicit entry is normalized', () => {
    const vfs = new MemoryVfs({ files: { '/app/start.tsx': 'x' } });

    expect(resolveEntry(vfs, 'app/start.tsx')).toBe('/app/start.tsx');
  });

  it('an explicit entry that does not exist gives undefined', () => {
    expect(resolveEntry(new MemoryVfs(), '/gone.tsx')).toBeUndefined();
  });

  it('without an entry it finds the scaffold main', () => {
    const vfs = new MemoryVfs({ files: { '/src/main.tsx': 'x' } });

    expect(resolveEntry(vfs, undefined)).toBe('/src/main.tsx');
  });

  it('without an entry it respects the candidate order', () => {
    const vfs = new MemoryVfs({ files: { '/src/index.tsx': 'x', '/src/main.tsx': 'y' } });

    expect(resolveEntry(vfs, undefined)).toBe('/src/main.tsx');
  });

  it('a project with no candidate gives undefined', () => {
    expect(
      resolveEntry(new MemoryVfs({ files: { '/a.ts': 'x' } }), undefined),
    ).toBeUndefined();
  });
});
