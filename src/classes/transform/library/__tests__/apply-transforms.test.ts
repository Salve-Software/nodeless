import type { SourceTransform, TransformInput } from '@/types/index.js';
import { describe, expect, it, vi } from 'vitest';
import { applyTransforms } from '@/classes/transform/library/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';

const file: TransformInput = {
  path: '/a.scss',
  content: 'x',
  vfs: new MemoryVfs(),
  resolve: () => undefined,
};

function transform(
  name: string,
  { matches, stage = 'content' }: { matches: boolean; stage?: SourceTransform['stage'] },
): SourceTransform {
  return {
    name,
    stage,
    matches: () => matches,
    apply: vi.fn(async ({ content }) => ({ content: `${content}+${name}` })),
  };
}

describe('applyTransforms', () => {
  // A .scss file using @apply needs Sass and then Tailwind. Picking one broke it.
  it('every content transform runs, each seeing the one before', async () => {
    const first = transform('first', { matches: true });
    const second = transform('second', { matches: true });

    expect(await applyTransforms([first, second], file)).toEqual({
      content: 'x+first+second',
    });
    expect(second.apply).toHaveBeenCalled();
  });

  it('skips the ones that do not match', async () => {
    expect(
      await applyTransforms(
        [transform('no', { matches: false }), transform('yes', { matches: true })],
        file,
      ),
    ).toEqual({ content: 'x+yes' });
  });

  // A file is written in one language, so only one transform can decide what it is.
  it('only one language transform runs', async () => {
    const first = transform('scss', { matches: true, stage: 'language' });
    const second = transform('less', { matches: true, stage: 'language' });

    expect(await applyTransforms([first, second], file)).toEqual({ content: 'x+scss' });
    expect(second.apply).not.toHaveBeenCalled();
  });

  // Sass has to turn .scss into CSS before Tailwind can read it as CSS.
  it('language runs before content, whatever the order given', async () => {
    const content = transform('tailwind', { matches: true });
    const language = transform('sass', { matches: true, stage: 'language' });

    expect(await applyTransforms([content, language], file)).toEqual({
      content: 'x+sass+tailwind',
    });
  });

  it('the loader of the last one that set it wins', async () => {
    const language: SourceTransform = {
      name: 'sass',
      stage: 'language',
      matches: () => true,
      apply: async ({ content }) => ({ content, loader: 'css' }),
    };

    expect(await applyTransforms([language], file)).toEqual({
      content: 'x',
      loader: 'css',
    });
  });

  // Nothing matching is the normal case: plain CSS and TypeScript need no transform.
  it('nothing matching leaves the file alone', async () => {
    expect(
      await applyTransforms([transform('no', { matches: false })], file),
    ).toBeUndefined();
    expect(await applyTransforms([], file)).toBeUndefined();
  });
});
