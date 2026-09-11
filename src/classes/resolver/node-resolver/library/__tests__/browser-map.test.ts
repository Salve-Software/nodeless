import { describe, expect, it } from 'vitest';
import { createScope } from '@/classes/resolver/node-resolver/__tests__/scope.js';
import { browserMap } from '@/classes/resolver/node-resolver/library/index.js';

const scope = createScope({});
const nodeScope = createScope({}, ['import', 'default']);

describe('browserMap', () => {
  it('gives the map when the browser condition is on', () => {
    expect(browserMap(scope, { browser: { fs: false } })).toEqual({ fs: false });
  });

  it('without the browser condition there is no map', () => {
    expect(browserMap(nodeScope, { browser: { fs: false } })).toBeUndefined();
  });

  it('a browser field in string form is an entry point, not a map', () => {
    expect(browserMap(scope, { browser: './b.js' })).toBeUndefined();
  });

  it('no browser field means no map', () => {
    expect(browserMap(scope, {})).toBeUndefined();
  });
});
