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

function transform(name: string, matches: boolean): SourceTransform {
  return {
    name,
    matches: () => matches,
    apply: vi.fn(async () => ({ content: name })),
  };
}

describe('applyTransforms', () => {
  it('uses the first one that claims the file', async () => {
    const first = transform('first', true);
    const second = transform('second', true);

    expect(await applyTransforms([first, second], file)).toEqual({ content: 'first' });
    expect(second.apply).not.toHaveBeenCalled();
  });

  it('skips the ones that do not match', async () => {
    expect(
      await applyTransforms([transform('no', false), transform('yes', true)], file),
    ).toEqual({
      content: 'yes',
    });
  });

  // Nothing matching is the normal case: plain CSS and TypeScript need no transform.
  it('nothing matching leaves the file alone', async () => {
    expect(await applyTransforms([transform('no', false)], file)).toBeUndefined();
    expect(await applyTransforms([], file)).toBeUndefined();
  });
});
