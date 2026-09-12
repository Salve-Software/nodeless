import { describe, expect, it } from 'vitest';
import { sealGlobals } from '@/classes/runtime/index.js';

describe('sealGlobals', () => {
  it('removes what reaches outside the worker', () => {
    const scope: Record<string, unknown> = {
      fetch: () => undefined,
      indexedDB: {},
      Math,
    };

    expect(sealGlobals(scope).sort()).toEqual(['fetch', 'indexedDB']);
    expect(scope['fetch']).toBeUndefined();
    expect(scope['indexedDB']).toBeUndefined();
    expect(scope['Math']).toBe(Math);
  });

  it('leaves a scope that never had them alone', () => {
    expect(sealGlobals({ Math })).toEqual([]);
  });

  it('makes the removal stick', () => {
    const scope: Record<string, unknown> = { fetch: () => undefined };

    sealGlobals(scope);
    expect(() => Object.defineProperty(scope, 'fetch', { value: 1 })).toThrowError();
  });
});
