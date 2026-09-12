import type { Plugin } from '@/types/index.js';
import { describe, expect, it } from 'vitest';
import { orderPlugins } from '@/classes/plugin/index.js';

const named = (name: string, enforce?: 'pre' | 'post'): Plugin => ({
  name,
  ...(enforce ? { enforce } : {}),
});

describe('orderPlugins', () => {
  it('puts pre first and post last, which is the order Vite documents', () => {
    const ordered = orderPlugins([
      named('post', 'post'),
      named('normal'),
      named('pre', 'pre'),
    ]);

    expect(ordered.map((plugin) => plugin.name)).toEqual(['pre', 'normal', 'post']);
  });

  it('keeps declaration order within a tier', () => {
    const ordered = orderPlugins([named('a'), named('b'), named('c')]);

    expect(ordered.map((plugin) => plugin.name)).toEqual(['a', 'b', 'c']);
  });
});
