import { describe, expect, it } from 'vitest';
import { isExternalSpecifier } from '@/classes/bundler/esbuild-bundler/library/index.js';

describe('isExternalSpecifier', () => {
  it('an absolute URL never goes through the VFS', () => {
    expect(isExternalSpecifier('https://esm.sh/react', [])).toBe(true);
    expect(isExternalSpecifier('data:text/javascript,0', [])).toBe(true);
  });

  it('a package on the external list matches exactly', () => {
    expect(isExternalSpecifier('react', ['react'])).toBe(true);
  });

  it('a package on the external list matches its subpaths', () => {
    expect(isExternalSpecifier('react-dom/client', ['react-dom'])).toBe(true);
  });

  // `react-dom` starts with `react`, but it is a different package.
  it('a name prefix does not match without the slash', () => {
    expect(isExternalSpecifier('react-dom', ['react'])).toBe(false);
  });

  it('anything off the list is not external', () => {
    expect(isExternalSpecifier('./App.tsx', ['react'])).toBe(false);
  });
});
