import { describe, expect, it } from 'vitest';
import { createScope } from '@/classes/resolver/node-resolver/__tests__/scope.js';
import { resolveLegacyEntry } from '@/classes/resolver/node-resolver/library/index.js';

const scope = createScope({});
const nodeScope = createScope({}, ['import', 'default']);

describe('resolveLegacyEntry', () => {
  it('the browser string comes before module and main', () => {
    expect(
      resolveLegacyEntry(scope, { browser: 'b.js', module: 'm.js', main: 'c.js' }),
    ).toEqual(['b.js', 'm.js', 'c.js']);
  });

  it('without the browser condition the browser field is ignored', () => {
    expect(resolveLegacyEntry(nodeScope, { browser: 'b.js', main: 'c.js' })).toEqual([
      'c.js',
    ]);
  });

  // The `browser` field in map form is a file override, not an entry point.
  it('a browser field in map form never becomes an entry', () => {
    expect(
      resolveLegacyEntry(scope, { browser: { './a.js': false }, main: 'c.js' }),
    ).toEqual(['c.js']);
  });

  it('a manifest with no fields gives an empty list', () => {
    expect(resolveLegacyEntry(scope, {})).toEqual([]);
  });
});
