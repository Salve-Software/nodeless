import { describe, expect, it } from 'vitest';
import {
  allocBuffer,
  bufferByteLength,
  concatBuffers,
  fromBuffer,
  isBuffer,
} from '@/classes/shims/nodeless-buffer/index.js';

describe('fromBuffer', () => {
  it('produces a real Uint8Array, which is what the toolchain passes around', () => {
    expect(fromBuffer('hi')).toBeInstanceOf(Uint8Array);
  });

  it('round trips base64', () => {
    expect(fromBuffer('nodeless').toString('base64')).toBe('bm9kZWxlc3M=');
    expect(fromBuffer('bm9kZWxlc3M=', 'base64').toString()).toBe('nodeless');
  });

  it('round trips hex', () => {
    expect(fromBuffer('abc').toString('hex')).toBe('616263');
    expect(fromBuffer('616263', 'hex').toString()).toBe('abc');
  });

  it('wraps an ArrayBuffer without copying its contents', () => {
    expect(fromBuffer(new Uint8Array([104, 105]).buffer).toString()).toBe('hi');
  });
});

describe('concatBuffers', () => {
  const parts = [fromBuffer('ab'), fromBuffer('cd')];

  it('joins every part', () => {
    expect(concatBuffers(parts).toString()).toBe('abcd');
  });

  it('stops at an explicit total', () => {
    expect(concatBuffers(parts, 3).toString()).toBe('abc');
  });
});

describe('allocBuffer', () => {
  it('zero fills by default', () => {
    expect([...allocBuffer(3)]).toEqual([0, 0, 0]);
  });

  it('honours an explicit fill', () => {
    expect([...allocBuffer(2, 7)]).toEqual([7, 7]);
  });
});

describe('bufferByteLength', () => {
  it('counts bytes and not characters', () => {
    expect(bufferByteLength('é')).toBe(2);
  });

  it('passes a Uint8Array through by length', () => {
    expect(bufferByteLength(new Uint8Array(4))).toBe(4);
  });
});

describe('isBuffer', () => {
  it('recognises only its own instances', () => {
    expect(isBuffer(fromBuffer('a'))).toBe(true);
    expect(isBuffer(new Uint8Array(1))).toBe(false);
  });
});

describe('the buffer itself', () => {
  it('serialises the way Node does', () => {
    expect(fromBuffer('ab').toJSON()).toEqual({ type: 'Buffer', data: [97, 98] });
  });

  it('compares by content', () => {
    expect(fromBuffer('ab').equals(fromBuffer('ab'))).toBe(true);
    expect(fromBuffer('ab').equals(fromBuffer('ac'))).toBe(false);
  });
});
