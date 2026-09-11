import { describe, expect, it } from 'vitest';
import { flattenPlugins, isPlugin } from '@/classes/plugin/index.js';

describe('flattenPlugins', () => {
  it('flattens the nested arrays a preset returns', () => {
    const flat = flattenPlugins([{ name: 'a' }, [{ name: 'b' }, [{ name: 'c' }]]]);

    expect(flat.map((plugin) => plugin.name)).toEqual(['a', 'b', 'c']);
  });

  it('drops the holes left by `condition && plugin()`', () => {
    expect(flattenPlugins([{ name: 'a' }, false, null, undefined])).toHaveLength(1);
  });

  it('accepts a lone plugin that was not wrapped in an array', () => {
    expect(flattenPlugins({ name: 'a' })).toHaveLength(1);
  });
});

describe('isPlugin', () => {
  it('recognises a plugin by its name, which is the only required field', () => {
    expect(isPlugin({ name: 'a' })).toBe(true);
    expect(isPlugin({})).toBe(false);
    expect(isPlugin(null)).toBe(false);
  });
});
