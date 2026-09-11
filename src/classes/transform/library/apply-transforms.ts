import type { SourceTransform, TransformInput, TransformResult } from '@/types/index.js';

/** The first transform that matches wins. Nothing matching means the file is already fine. */
export async function applyTransforms(
  transforms: SourceTransform[],
  file: TransformInput,
): Promise<TransformResult | undefined> {
  for (const transform of transforms) {
    if (transform.matches(file)) return transform.apply(file);
  }

  return undefined;
}
