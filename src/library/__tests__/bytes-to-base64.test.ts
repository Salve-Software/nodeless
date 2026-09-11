import { describe, expect, it } from 'vitest';
import { base64ToBytes, bytesToBase64, textToBytes } from '@/library/index.js';

describe('bytesToBase64', () => {
  it('round-trips without losing a byte', () => {
    const bytes = textToBytes('const x = "café"; // 🎉');

    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });

  it('preserves binary bytes outside the text range', () => {
    const bytes = new Uint8Array([0, 1, 127, 128, 255]);

    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });

  // `String.fromCharCode(...bytes)` blows the stack without the 32k chunking.
  it('survives a file larger than the 32k chunk', () => {
    const bytes = new Uint8Array(200_000).map((_, index) => index % 256);

    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });

  it('empty bytes give an empty string', () => {
    expect(bytesToBase64(new Uint8Array())).toBe('');
  });
});
