import { describe, expect, it } from 'vitest';
import {
  createScope,
  manifest,
} from '@/classes/resolver/node-resolver/__tests__/scope.js';
import { resolveSpecifier } from '@/classes/resolver/node-resolver/library/index.js';
import { ResolveError } from '@/errors/index.js';

const scope = createScope({
  '/package.json': manifest({ name: 'app', dependencies: { react: '19' } }),
  '/src/main.tsx': 'x',
  '/src/App.tsx': 'x',
  '/src/lib/index.ts': 'x',
  '/src/app.css': 'x',
  '/node_modules/react/package.json': manifest({
    name: 'react',
    exports: { '.': './index.js', './jsx-runtime': './jsx-runtime.js' },
  }),
  '/node_modules/react/index.js': 'x',
  '/node_modules/react/jsx-runtime.js': 'x',
  '/node_modules/legacy/package.json': manifest({ name: 'legacy', main: 'main.js' }),
  '/node_modules/legacy/main.js': 'x',
  '/node_modules/legacy/node_modules/react/package.json': manifest({
    name: 'react',
    main: 'old.js',
  }),
  '/node_modules/legacy/node_modules/react/old.js': 'x',
  '/node_modules/shim/package.json': manifest({
    name: 'shim',
    main: 'main.js',
    browser: { fs: false, './main.js': './browser.js' },
  }),
  '/node_modules/shim/main.js': 'x',
  '/node_modules/shim/browser.js': 'x',
});

function resolve(specifier: string, importer = '/src/main.tsx') {
  return resolveSpecifier(scope, { specifier, importer });
}

describe('resolveSpecifier', () => {
  it('resolves a relative import with the extension omitted', () => {
    expect(resolve('./App')).toEqual({ kind: 'file', path: '/src/App.tsx' });
  });

  it('resolves a relative import to a folder index', () => {
    expect(resolve('./lib')).toEqual({ kind: 'file', path: '/src/lib/index.ts' });
  });

  it('resolves CSS imported from TSX', () => {
    expect(resolve('./app.css')).toEqual({ kind: 'file', path: '/src/app.css' });
  });

  it('resolves an absolute VFS path', () => {
    expect(resolve('/src/App.tsx')).toEqual({ kind: 'file', path: '/src/App.tsx' });
  });

  it('an entry point resolves without an importer', () => {
    expect(resolve('/src/main.tsx', '')).toEqual({ kind: 'file', path: '/src/main.tsx' });
  });

  it('resolves a bare import through the exports field', () => {
    expect(resolve('react')).toEqual({
      kind: 'file',
      path: '/node_modules/react/index.js',
    });
  });

  it('resolves an exports subpath — this is what automatic JSX imports', () => {
    expect(resolve('react/jsx-runtime')).toEqual({
      kind: 'file',
      path: '/node_modules/react/jsx-runtime.js',
    });
  });

  it('resolves a package without exports through main', () => {
    expect(resolve('legacy')).toEqual({
      kind: 'file',
      path: '/node_modules/legacy/main.js',
    });
  });

  // Hoisting with a conflict: the nested node_modules wins for whoever lives inside it.
  it('a nested node_modules beats the root one', () => {
    expect(resolve('react', '/node_modules/legacy/main.js')).toEqual({
      kind: 'file',
      path: '/node_modules/legacy/node_modules/react/old.js',
    });
  });

  it('a Node builtin becomes an empty module with a reason', () => {
    const result = resolve('node:fs');

    expect(result.kind).toBe('empty');
    expect(result).toMatchObject({ reason: expect.stringContaining('Node builtin') });
  });

  it('a browser field mapped to false becomes an empty module', () => {
    expect(resolve('fs', '/node_modules/shim/main.js').kind).toBe('empty');
  });

  it('the browser field redirects the resolved file', () => {
    expect(resolve('shim')).toEqual({
      kind: 'file',
      path: '/node_modules/shim/browser.js',
    });
  });

  it('an import that does not exist throws ResolveError naming the importer', () => {
    expect(() => resolve('./gone')).toThrow(ResolveError);
    expect(() => resolve('not-installed')).toThrow(/Cannot resolve "not-installed"/);
  });

  it('a missing entry point says so in the error', () => {
    expect(() => resolve('/src/gone.tsx', '')).toThrow(/<entry point>/);
  });
});

describe('resolveSpecifier, from a stylesheet', () => {
  const styles = createScope({
    '/src/index.css': '@import "tailwindcss";',
    '/src/main.ts': 'x',
    '/src/theme.css': 'x',
    '/src/theme.ts': 'x',
    '/node_modules/tailwindcss/package.json': manifest({
      name: 'tailwindcss',
      exports: {
        '.': { style: './index.css', import: './dist/lib.mjs', require: './dist/lib.js' },
      },
    }),
    '/node_modules/tailwindcss/index.css': '@layer base {}',
    '/node_modules/tailwindcss/dist/lib.mjs': 'export default 1;',
  });

  // Without this the resolver hands lib.mjs to the CSS parser, and esbuild refuses it.
  it('picks the style condition instead of import', () => {
    expect(
      resolveSpecifier(styles, { specifier: 'tailwindcss', importer: '/src/index.css' }),
    ).toEqual({ kind: 'file', path: '/node_modules/tailwindcss/index.css' });
  });

  it('the same package from JavaScript still resolves to its JavaScript entry', () => {
    expect(
      resolveSpecifier(styles, { specifier: 'tailwindcss', importer: '/src/main.ts' }),
    ).toEqual({ kind: 'file', path: '/node_modules/tailwindcss/dist/lib.mjs' });
  });

  it('an extensionless relative import resolves to the stylesheet, not the module', () => {
    expect(
      resolveSpecifier(styles, { specifier: './theme', importer: '/src/index.css' }),
    ).toEqual({ kind: 'file', path: '/src/theme.css' });
  });
});
