import { describe, expect, it } from 'vitest';
import { bytesToText, textToBytes } from '@/library/index.js';

describe('textToBytes', () => {
  it('encodes as UTF-8', () => {
    expect([...textToBytes('é')]).toEqual([0xc3, 0xa9]);
  });

  it('round-trips with bytesToText', () => {
    expect(bytesToText(textToBytes('import React from "react";'))).toBe(
      'import React from "react";',
    );
  });
});
