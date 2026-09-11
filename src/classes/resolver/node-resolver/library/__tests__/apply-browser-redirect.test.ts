import { describe, expect, it } from 'vitest';
import {
  createScope,
  manifest,
} from '@/classes/resolver/node-resolver/__tests__/scope.js';
import { applyBrowserRedirect } from '@/classes/resolver/node-resolver/library/index.js';

const files = {
  '/node_modules/p/package.json': manifest({
    name: 'p',
    browser: { './lib/node.js': './lib/browser.js', './lib/off.js': false },
  }),
  '/node_modules/p/lib/node.js': 'x',
  '/node_modules/p/lib/browser.js': 'y',
  '/node_modules/p/lib/off.js': 'z',
  '/node_modules/p/lib/other.js': 'w',
};
const scope = createScope(files);
const owner = {
  dir: '/node_modules/p',
  manifest: scope.readManifest('/node_modules/p') ?? {},
};

describe('applyBrowserRedirect', () => {
  it('a file mapped to another becomes a redirect', () => {
    expect(
      applyBrowserRedirect(scope, { owner, path: '/node_modules/p/lib/node.js' }),
    ).toEqual({ kind: 'redirect', specifier: './lib/browser.js' });
  });

  it('a file mapped to false becomes an empty module', () => {
    expect(
      applyBrowserRedirect(scope, { owner, path: '/node_modules/p/lib/off.js' }),
    ).toEqual({ kind: 'empty' });
  });

  it('a file outside the map is left alone', () => {
    expect(
      applyBrowserRedirect(scope, { owner, path: '/node_modules/p/lib/other.js' }),
    ).toBeUndefined();
  });

  // A key without `./` is a package alias, and that is applyBrowserAlias's job.
  it('a bare key is ignored here', () => {
    const bare = { dir: '/p', manifest: { name: 'p', browser: { fs: false as const } } };

    expect(applyBrowserRedirect(scope, { owner: bare, path: '/p/fs' })).toBeUndefined();
  });
});
