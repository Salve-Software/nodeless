import { describe, expect, it } from 'vitest';
import { cdnSpecifier } from '@/classes/bundler/esbuild-bundler/library/index.js';

const url = 'https://esm.sh';

describe('cdnSpecifier', () => {
  it('pins the package to the range the project declares', () => {
    expect(cdnSpecifier('react', { url, dependencies: { react: '^19.0.0' } })).toBe(
      'https://esm.sh/react@^19.0.0',
    );
  });

  it('keeps the subpath after the version', () => {
    expect(
      cdnSpecifier('react-dom/client', { url, dependencies: { 'react-dom': '^19.0.0' } }),
    ).toBe('https://esm.sh/react-dom@^19.0.0/client');
  });

  it('a scoped package keeps both name segments', () => {
    expect(
      cdnSpecifier('@radix-ui/react-dialog', {
        url,
        dependencies: { '@radix-ui/react-dialog': '^1.1.0' },
      }),
    ).toBe('https://esm.sh/@radix-ui/react-dialog@^1.1.0');
  });

  // An undeclared package still resolves; the CDN just picks latest.
  it('leaves the version off when the project does not declare one', () => {
    expect(cdnSpecifier('zustand', { url })).toBe('https://esm.sh/zustand');
  });

  it('tolerates a trailing slash on the url', () => {
    expect(cdnSpecifier('react', { url: 'https://esm.sh/' })).toBe(
      'https://esm.sh/react',
    );
  });
});
