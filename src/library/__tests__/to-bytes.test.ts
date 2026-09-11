import { describe, expect, it } from 'vitest';
import { bytesToText, toBytes } from '@/library/index.js';

describe('toBytes', () => {
  it('encodes text', () => {
    expect(bytesToText(toBytes('hello'))).toBe('hello');
  });

  it('passes bytes through without copying', () => {
    const bytes = new Uint8Array([1, 2, 3]);

    expect(toBytes(bytes)).toBe(bytes);
  });
});
