import type { BuildMode, RuntimeModule } from '@/types/index.js';

/**
 * `defineConfig` takes an object or a function of the build env, and the function may be
 * async. All three spellings are in the wild and none of them is deprecated.
 */
export async function resolveConfigExport(
  module: RuntimeModule,
  mode: BuildMode,
): Promise<Record<string, unknown>> {
  const exported = module['default'] ?? module;

  if (typeof exported !== 'function') return exported as Record<string, unknown>;

  const produce = exported as (env: {
    mode: string;
    command: string;
  }) => Promise<Record<string, unknown>>;

  return produce({ mode, command: 'build' });
}
