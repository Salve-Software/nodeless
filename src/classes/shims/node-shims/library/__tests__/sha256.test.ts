import { describe, expect, it } from 'vitest';
import { sha256 } from '@/classes/shims/node-shims/library/index.js';
import { fromBuffer } from '@/classes/shims/nodeless-buffer/index.js';

const hex = (input: string): string => fromBuffer(sha256(input)).toString('hex');

describe('sha256', () => {
  it('matches the published digest for "abc"', () => {
    expect(hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('matches the published digest for the empty string', () => {
    expect(hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('spans two blocks', () => {
    expect(hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('spans three blocks', () => {
    const input =
      'abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmno' +
      'ijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu';

    expect(hex(input)).toBe(
      'cf5b16a778af8380036ce59e7b0492370b249b11e8f07a51afac45037afee9d1',
    );
  });
});
