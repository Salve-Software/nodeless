import type { BundleModuleScope } from '@/classes/runtime/module-runtime/types/index.js';
import {
  MODULE_GLOBAL,
  RUNTIME_TARGET,
} from '@/classes/runtime/module-runtime/constants/index.js';
import { ROOT_PATH } from '@/constants/index.js';
import { initializeEsbuild, loadEsbuild } from '@/library/index.js';
import { createRuntimePlugin } from './create-runtime-plugin.js';
import { toRuntimeError } from './to-runtime-error.js';

/**
 * The config graph, bundled the way the app graph is. Everything that decides isolation
 * happens here: resolution runs through `isShimmed`, so the real builtin never lands.
 */
export async function bundleModule(
  { vfs, resolver, isShimmed, esbuild, wasmURL }: BundleModuleScope,
  path: string,
): Promise<string> {
  const api = esbuild ?? (await loadEsbuild());

  await initializeEsbuild(api, wasmURL);

  const result = await api.build({
    entryPoints: [path],
    bundle: true,
    write: false,
    format: 'iife',
    globalName: MODULE_GLOBAL,
    // `browser` would substitute a literal for `process.env.NODE_ENV`; the shim owns it.
    platform: 'neutral',
    target: RUNTIME_TARGET,
    absWorkingDir: ROOT_PATH,
    logLevel: 'silent',
    sourcemap: 'inline',
    plugins: [createRuntimePlugin({ vfs, resolver, isShimmed })],
  });

  const code = result.outputFiles?.[0]?.text;

  if (code === undefined) throw toRuntimeError(new Error('emitted nothing'), path);

  return code;
}
