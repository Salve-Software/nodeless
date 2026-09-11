import { describe, expect, it } from 'vitest';
import { toFailureMessages } from '@/classes/bundler/esbuild-bundler/library/index.js';

describe('toFailureMessages', () => {
  it('unpacks the error list esbuild throws', () => {
    const thrown = {
      errors: [{ text: 'Could not resolve "react"', location: null, notes: [] }],
    };

    expect(toFailureMessages(thrown)).toEqual([{ text: 'Could not resolve "react"' }]);
  });

  it('a plain Error becomes a single message', () => {
    expect(toFailureMessages(new Error('boom'))).toEqual([{ text: 'boom' }]);
  });

  // Without this, an unexpected throw would surface as `[object Object]` with no context.
  it('a throw that is not an Error still becomes a message', () => {
    expect(toFailureMessages('loose string')).toEqual([{ text: 'loose string' }]);
  });

  it('an object with an empty errors list falls through to the generic path', () => {
    expect(toFailureMessages({ errors: [] })).toEqual([{ text: '[object Object]' }]);
  });
});
