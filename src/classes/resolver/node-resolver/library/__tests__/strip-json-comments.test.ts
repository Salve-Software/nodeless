import { describe, expect, it } from 'vitest';
import { stripJsonComments } from '@/classes/resolver/node-resolver/library/index.js';

describe('stripJsonComments', () => {
  it('removes line comments', () => {
    expect(JSON.parse(stripJsonComments('{ // note\n "a": 1 }'))).toEqual({ a: 1 });
  });

  it('removes block comments', () => {
    expect(JSON.parse(stripJsonComments('{ /* note */ "a": 1 }'))).toEqual({ a: 1 });
  });

  it('removes trailing commas', () => {
    expect(JSON.parse(stripJsonComments('{ "a": [1, 2,], }'))).toEqual({ a: [1, 2] });
  });

  // A URL inside a string is not a comment, and cutting there corrupts the file.
  it('leaves slashes inside strings alone', () => {
    expect(JSON.parse(stripJsonComments('{ "url": "https://x.dev/a" }'))).toEqual({
      url: 'https://x.dev/a',
    });
  });

  it('leaves an escaped quote alone', () => {
    expect(JSON.parse(stripJsonComments('{ "a": "say \\"hi\\" // now" }'))).toEqual({
      a: 'say "hi" // now',
    });
  });
});
