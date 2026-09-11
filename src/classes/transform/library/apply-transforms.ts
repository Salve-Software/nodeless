import type {
  SourceTransform,
  TransformInput,
  TransformLoader,
  TransformResult,
} from '@/types/index.js';
import { orderTransforms } from './order-transforms.js';

/**
 * A pipeline, not a switch. One language transform runs, then every content transform that
 * claims the result, each seeing what the one before it produced.
 */
export async function applyTransforms(
  transforms: SourceTransform[],
  file: TransformInput,
): Promise<TransformResult | undefined> {
  let content = file.content;
  let loader: TransformLoader | undefined;
  let languageDone = false;
  let touched = false;

  for (const transform of orderTransforms(transforms)) {
    if (transform.stage === 'language' && languageDone) continue;
    if (!transform.matches({ path: file.path, content })) continue;

    const result = await transform.apply({ ...file, content });

    content = result.content;
    loader = result.loader ?? loader;
    languageDone ||= transform.stage === 'language';
    touched = true;
  }

  return touched ? { content, ...(loader === undefined ? {} : { loader }) } : undefined;
}
