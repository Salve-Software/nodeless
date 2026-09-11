import { describe, expect, it } from 'vitest';
import { createScope } from '@/classes/resolver/node-resolver/__tests__/scope.js';
import { scopeForImporter } from '@/classes/resolver/node-resolver/library/index.js';

const scope = createScope({});

describe('scopeForImporter', () => {
  it('a stylesheet resolves through the style condition', () => {
    expect(scopeForImporter(scope, '/src/index.css').conditions).toEqual([
      'style',
      'default',
    ]);
  });

  // `@import './theme'` in CSS cannot mean `theme.tsx`.
  it('a stylesheet only tries the css extension', () => {
    expect(scopeForImporter(scope, '/src/index.css').extensions).toEqual(['.css']);
  });

  it('anything else keeps the scope it was given', () => {
    expect(scopeForImporter(scope, '/src/main.tsx')).toBe(scope);
    expect(scopeForImporter(scope, '')).toBe(scope);
  });

  it('the manifest cache survives the swap', () => {
    expect(scopeForImporter(scope, '/a.css').readManifest).toBe(scope.readManifest);
  });
});
