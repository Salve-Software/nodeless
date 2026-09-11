import { describe, expect, it } from 'vitest';
import {
  createScope,
  manifest,
} from '@/classes/resolver/node-resolver/__tests__/scope.js';
import { findPackageScope } from '@/classes/resolver/node-resolver/library/index.js';

const scope = createScope({
  '/package.json': manifest({ name: 'app' }),
  '/node_modules/p/package.json': manifest({ name: 'p' }),
  '/node_modules/p/lib/deep/x.js': 'x',
});

describe('findPackageScope', () => {
  it('finds the nearest package.json walking up', () => {
    expect(findPackageScope(scope, '/node_modules/p/lib/deep')?.dir).toBe(
      '/node_modules/p',
    );
  });

  it('outside any package it lands on the root package.json', () => {
    expect(findPackageScope(scope, '/src')?.manifest.name).toBe('app');
  });

  it('no package.json anywhere gives undefined', () => {
    expect(findPackageScope(createScope({ '/src/a.ts': 'x' }), '/src')).toBeUndefined();
  });
});
