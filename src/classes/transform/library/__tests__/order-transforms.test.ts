import type { SourceTransform } from '@/types/index.js';
import { describe, expect, it } from 'vitest';
import { orderTransforms } from '@/classes/transform/library/index.js';

function transform(name: string, stage: SourceTransform['stage']): SourceTransform {
  return {
    name,
    stage,
    matches: () => true,
    apply: async ({ content }) => ({ content }),
  };
}

describe('orderTransforms', () => {
  it('puts language before content', () => {
    const ordered = orderTransforms([
      transform('tailwind', 'content'),
      transform('sass', 'language'),
    ]);

    expect(ordered.map((t) => t.name)).toEqual(['sass', 'tailwind']);
  });

  // A caller's transform has to be able to claim a file before the built-in one does.
  it('keeps the given order within a stage', () => {
    const ordered = orderTransforms([
      transform('mine', 'content'),
      transform('theirs', 'content'),
    ]);

    expect(ordered.map((t) => t.name)).toEqual(['mine', 'theirs']);
  });
});
