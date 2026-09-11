import { describe, expect, it } from 'vitest';
import { createScope } from '@/classes/resolver/node-resolver/__tests__/scope.js';
import { applyBrowserAlias } from '@/classes/resolver/node-resolver/library/index.js';

const scope = createScope({});
const owner = {
  dir: '/node_modules/p',
  manifest: { name: 'p', browser: { fs: false as const, crypto: 'crypto-js' } },
};

describe('applyBrowserAlias', () => {
  it('a key mapped to false becomes an empty module', () => {
    expect(applyBrowserAlias(scope, { owner, specifier: 'fs' })).toEqual({
      kind: 'empty',
    });
  });

  it('a key mapped to a string becomes a redirect', () => {
    expect(applyBrowserAlias(scope, { owner, specifier: 'crypto' })).toEqual({
      kind: 'redirect',
      specifier: 'crypto-js',
    });
  });

  it('a specifier outside the map is left alone', () => {
    expect(applyBrowserAlias(scope, { owner, specifier: 'react' })).toBeUndefined();
  });
});
