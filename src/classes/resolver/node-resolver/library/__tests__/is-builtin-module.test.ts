import { describe, expect, it } from 'vitest';
import { isBuiltinModule } from '@/classes/resolver/node-resolver/library/index.js';

describe('isBuiltinModule', () => {
  it('recognizes a bare builtin', () => {
    expect(isBuiltinModule('fs')).toBe(true);
    expect(isBuiltinModule('child_process')).toBe(true);
  });

  it('recognizes the node: prefix', () => {
    expect(isBuiltinModule('node:path')).toBe(true);
  });

  it('a registry package with a similar name is not a builtin', () => {
    expect(isBuiltinModule('path-browserify')).toBe(false);
    expect(isBuiltinModule('react')).toBe(false);
  });
});
