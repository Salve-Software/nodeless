import type {
  PluginLoadResult,
  PluginTransformResult,
  TransformLoader,
} from '@/types/index.js';

/** `map` is deliberately dropped: esbuild's `onLoad` has no channel for an input sourcemap. */
export function normalizeCodeResult(
  result: PluginLoadResult | PluginTransformResult,
): { code: string; loader?: TransformLoader } | undefined {
  if (result === null || result === undefined) return undefined;
  if (typeof result === 'string') return { code: result };

  return {
    code: result.code,
    ...(result.loader === undefined ? {} : { loader: result.loader }),
  };
}
