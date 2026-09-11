import { describe, expect, it } from 'vitest';
import { readDependencies } from '@/classes/bundler/esbuild-bundler/library/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';

describe('readDependencies', () => {
  it('reads dependencies from the project manifest', () => {
    const vfs = new MemoryVfs({
      files: { '/package.json': '{"dependencies":{"react":"^19.0.0"}}' },
    });

    expect(readDependencies(vfs)).toEqual({ react: '^19.0.0' });
  });

  // Pinning is a nicety, not a requirement: a broken manifest must not fail the build.
  it('a missing or broken manifest just means no pinning', () => {
    expect(readDependencies(new MemoryVfs())).toEqual({});
    expect(
      readDependencies(new MemoryVfs({ files: { '/package.json': '{ nope' } })),
    ).toEqual({});
  });

  it('a manifest with no dependencies gives nothing to pin', () => {
    expect(readDependencies(new MemoryVfs({ files: { '/package.json': '{}' } }))).toEqual(
      {},
    );
  });
});
