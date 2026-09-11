import { describe, expect, it } from 'vitest';
import { parseSpecifier } from '@/classes/resolver/node-resolver/library/index.js';

describe('parseSpecifier', () => {
  it('a package without a subpath gets the dot subpath', () => {
    expect(parseSpecifier('react')).toEqual({ name: 'react', subpath: '.' });
  });

  it('splits the subpath off an unscoped package', () => {
    expect(parseSpecifier('react-dom/client')).toEqual({
      name: 'react-dom',
      subpath: './client',
    });
  });

  it('a scoped package keeps both segments in the name', () => {
    expect(parseSpecifier('@radix-ui/react-dialog')).toEqual({
      name: '@radix-ui/react-dialog',
      subpath: '.',
    });
  });

  it('handles a scoped package with a deep subpath', () => {
    expect(parseSpecifier('@radix-ui/react-dialog/dist/index.mjs')).toEqual({
      name: '@radix-ui/react-dialog',
      subpath: './dist/index.mjs',
    });
  });
});
