import type { SourceTransform } from '@/types/index.js';

/** Language first: a `.scss` file has to become CSS before anything reads it as CSS. */
export function orderTransforms(transforms: SourceTransform[]): SourceTransform[] {
  return [
    ...transforms.filter((transform) => transform.stage === 'language'),
    ...transforms.filter((transform) => transform.stage === 'content'),
  ];
}
