import { describe, expect, it } from 'vitest';
import { isRelativeSpecifier } from '@/classes/resolver/node-resolver/library/index.js';

describe('isRelativeSpecifier', () => {
  it('recognizes ./ and ../', () => {
    expect(isRelativeSpecifier('./App.js')).toBe(true);
    expect(isRelativeSpecifier('../lib/x.js')).toBe(true);
  });

  it('recognizes the current and parent directory', () => {
    expect(isRelativeSpecifier('.')).toBe(true);
    expect(isRelativeSpecifier('..')).toBe(true);
  });

  it('a bare import is not relative', () => {
    expect(isRelativeSpecifier('react')).toBe(false);
    expect(isRelativeSpecifier('@radix-ui/react-dialog')).toBe(false);
  });

  // `.pnpm` and friends start with a dot but are not relative paths.
  it('a name starting with a dot but no slash is not relative', () => {
    expect(isRelativeSpecifier('.pnpm')).toBe(false);
  });
});
