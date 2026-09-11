import { describe, expect, it } from 'vitest';
import {
  createScope,
  manifest,
} from '@/classes/resolver/node-resolver/__tests__/scope.js';
import { loadAsDirectory } from '@/classes/resolver/node-resolver/library/index.js';

describe('loadAsDirectory', () => {
  it('without a package.json it falls back to index', () => {
    const scope = createScope({ '/p/index.ts': 'x' });

    expect(loadAsDirectory(scope, '/p')).toBe('/p/index.ts');
  });

  it('follows main from the package.json', () => {
    const scope = createScope({
      '/p/package.json': manifest({ name: 'p', main: 'lib/a.js' }),
      '/p/lib/a.js': 'x',
    });

    expect(loadAsDirectory(scope, '/p')).toBe('/p/lib/a.js');
  });

  it('module beats main', () => {
    const scope = createScope({
      '/p/package.json': manifest({ name: 'p', module: 'esm.js', main: 'cjs.js' }),
      '/p/esm.js': 'x',
      '/p/cjs.js': 'y',
    });

    expect(loadAsDirectory(scope, '/p')).toBe('/p/esm.js');
  });

  it('a main pointing at a folder falls back to that folder index', () => {
    const scope = createScope({
      '/p/package.json': manifest({ name: 'p', main: 'lib' }),
      '/p/lib/index.js': 'x',
    });

    expect(loadAsDirectory(scope, '/p')).toBe('/p/lib/index.js');
  });

  it('a broken main falls back to the package root index', () => {
    const scope = createScope({
      '/p/package.json': manifest({ name: 'p', main: 'gone.js' }),
      '/p/index.js': 'x',
    });

    expect(loadAsDirectory(scope, '/p')).toBe('/p/index.js');
  });

  it('nothing at all gives undefined', () => {
    expect(loadAsDirectory(createScope({}), '/p')).toBeUndefined();
  });
});
