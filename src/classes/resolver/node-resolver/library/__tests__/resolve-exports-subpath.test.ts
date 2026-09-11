import { describe, expect, it } from 'vitest';
import { createScope } from '@/classes/resolver/node-resolver/__tests__/scope.js';
import { resolveExportsSubpath } from '@/classes/resolver/node-resolver/library/index.js';

const scope = createScope({});
const nodeScope = createScope({}, ['node', 'import', 'default']);

describe('resolveExportsSubpath', () => {
  it('resolves the dot entry through the import condition', () => {
    expect(
      resolveExportsSubpath(scope, {
        manifest: {
          name: 'p',
          exports: { '.': { import: './esm.js', require: './cjs.js' } },
        },
        subpath: '.',
      }),
    ).toEqual(['./esm.js']);
  });

  it('the browser condition beats import when the package declares it first', () => {
    expect(
      resolveExportsSubpath(scope, {
        manifest: {
          name: 'p',
          exports: { '.': { browser: './b.js', import: './esm.js' } },
        },
        subpath: '.',
      }),
    ).toEqual(['./b.js']);
  });

  it('without the browser condition it falls to import', () => {
    expect(
      resolveExportsSubpath(nodeScope, {
        manifest: {
          name: 'p',
          exports: { '.': { browser: './b.js', import: './esm.js' } },
        },
        subpath: '.',
      }),
    ).toEqual(['./esm.js']);
  });

  it('resolves a declared subpath', () => {
    expect(
      resolveExportsSubpath(scope, {
        manifest: { name: 'p', exports: { '.': './i.js', './client': './c.js' } },
        subpath: './client',
      }),
    ).toEqual(['./c.js']);
  });

  it('resolves a wildcard', () => {
    expect(
      resolveExportsSubpath(scope, {
        manifest: { name: 'p', exports: { './lib/*': './src/*.js' } },
        subpath: './lib/util',
      }),
    ).toEqual(['./src/util.js']);
  });

  // A package with `exports` is sealed: what is not in there does not exist.
  it('an unexported subpath gives an empty list instead of throwing', () => {
    expect(
      resolveExportsSubpath(scope, {
        manifest: { name: 'p', exports: { '.': './i.js' } },
        subpath: './internal',
      }),
    ).toEqual([]);
  });

  it('a manifest without a name still resolves', () => {
    expect(
      resolveExportsSubpath(scope, { manifest: { exports: './i.js' }, subpath: '.' }),
    ).toEqual(['./i.js']);
  });
});
