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

describe('readRootDependencies, devDependencies', () => {
  const manifest = {
    dependencies: { react: '^19.0.0' },
    devDependencies: { tailwindcss: '^4.0.0' },
  };

  it('are left out by default', () => {
    expect(readRootDependencies(vfsWith(manifest)).map((r) => r.name)).toEqual(['react']);
  });

  // A Vite project keeps its CSS toolchain there, and the CSS cannot resolve without it.
  it('come in when dev is set', () => {
    expect(
      readRootDependencies(vfsWith(manifest), { dev: true })
        .map((r) => r.name)
        .sort(),
    ).toEqual(['react', 'tailwindcss']);
  });

  it('a dependency wins over a devDependency of the same name', () => {
    const both = { dependencies: { p: '^2.0.0' }, devDependencies: { p: '^1.0.0' } };

    expect(readRootDependencies(vfsWith(both), { dev: true })[0]?.range).toBe('^2.0.0');
  });
});

describe('readRootDependencies, picking devDependencies by name', () => {
  const manifest = {
    dependencies: { react: '^19.0.0' },
    devDependencies: { tailwindcss: '^4.0.0', vite: '^6.0.0', eslint: '^9.0.0' },
  };

  // `dev: true` on a real Vite project is 165 packages to get one of them.
  it('a list takes only what it names', () => {
    expect(
      readRootDependencies(vfsWith(manifest), { dev: ['tailwindcss'] })
        .map((r) => r.name)
        .sort(),
    ).toEqual(['react', 'tailwindcss']);
  });

  it('a name that is not a devDependency is ignored', () => {
    expect(
      readRootDependencies(vfsWith(manifest), { dev: ['nope'] }).map((r) => r.name),
    ).toEqual(['react']);
  });

  it('an empty list is the same as not asking', () => {
    expect(
      readRootDependencies(vfsWith(manifest), { dev: [] }).map((r) => r.name),
    ).toEqual(['react']);
  });

  it('the range comes from the devDependencies entry', () => {
    expect(
      readRootDependencies(vfsWith(manifest), { dev: ['vite'] }).find(
        (r) => r.name === 'vite',
      )?.range,
    ).toBe('^6.0.0');
  });
});
