import { describe, expect, it } from 'vitest';
import {
  createScope,
  manifest,
} from '@/classes/resolver/node-resolver/__tests__/scope.js';
import { resolveInPackage } from '@/classes/resolver/node-resolver/library/index.js';

describe('resolveInPackage', () => {
  it('uses exports when the package has it', () => {
    const scope = createScope({ '/p/esm.js': 'x', '/p/main.js': 'y' });

    expect(
      resolveInPackage(scope, {
        packageDir: '/p',
        manifest: { name: 'p', exports: './esm.js', main: './main.js' },
        subpath: '.',
      }),
    ).toBe('/p/esm.js');
  });

  // A package with `exports` never falls back to `main` for an unmapped subpath.
  it('a sealed exports does not fall back to main', () => {
    const scope = createScope({ '/p/main.js': 'y', '/p/internal.js': 'z' });

    expect(
      resolveInPackage(scope, {
        packageDir: '/p',
        manifest: { name: 'p', exports: { '.': './main.js' }, main: './main.js' },
        subpath: './internal',
      }),
    ).toBeUndefined();
  });

  it('without exports the dot entry goes through main', () => {
    const scope = createScope({
      '/p/package.json': manifest({ name: 'p', main: 'main.js' }),
      '/p/main.js': 'y',
    });

    expect(
      resolveInPackage(scope, {
        packageDir: '/p',
        manifest: { name: 'p', main: 'main.js' },
        subpath: '.',
      }),
    ).toBe('/p/main.js');
  });

  it('without exports a subpath is a file path, extension optional', () => {
    const scope = createScope({ '/p/lib/util.js': 'y' });

    expect(
      resolveInPackage(scope, {
        packageDir: '/p',
        manifest: { name: 'p' },
        subpath: './lib/util',
      }),
    ).toBe('/p/lib/util.js');
  });

  it('without exports a subpath can be a folder with an index', () => {
    const scope = createScope({ '/p/lib/index.js': 'y' });

    expect(
      resolveInPackage(scope, {
        packageDir: '/p',
        manifest: { name: 'p' },
        subpath: './lib',
      }),
    ).toBe('/p/lib/index.js');
  });
});
