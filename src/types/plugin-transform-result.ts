import type { TransformLoader } from './transform-loader.js';

/** `map` is accepted for protocol compatibility and dropped: esbuild takes no input map. */
export type PluginTransformResult =
  string | { code: string; map?: unknown; loader?: TransformLoader } | null | undefined;
