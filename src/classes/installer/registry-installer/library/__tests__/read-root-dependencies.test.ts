import { describe, expect, it } from 'vitest';
import { readRootDependencies } from '@/classes/installer/registry-installer/library/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';
import { InstallError } from '@/errors/index.js';

function vfsWith(manifest: unknown): MemoryVfs {
  return new MemoryVfs({ files: { '/package.json': JSON.stringify(manifest) } });
}

describe('readRootDependencies', () => {
  it('turns dependencies into requests rooted at /', () => {
    expect(readRootDependencies(vfsWith({ dependencies: { react: '^19.0.0' } }))).toEqual(
      [{ name: 'react', range: '^19.0.0', parentDir: '/' }],
    );
  });

  // A browser bundle never needs the build tooling of the project it bundles.
  it('ignores devDependencies', () => {
    expect(
      readRootDependencies(vfsWith({ devDependencies: { vitest: '^3.0.0' } })),
    ).toEqual([]);
  });

  it('a manifest with no dependencies gives no requests', () => {
    expect(readRootDependencies(vfsWith({ name: 'app' }))).toEqual([]);
  });

  it('no package.json fails with the path', () => {
    expect(() => readRootDependencies(new MemoryVfs())).toThrow(/\/package\.json/);
  });

  it('invalid JSON fails instead of installing nothing', () => {
    const vfs = new MemoryVfs({ files: { '/package.json': '{ nope' } });

    expect(() => readRootDependencies(vfs)).toThrow(InstallError);
  });
});
