import type { EsbuildApi } from '@/types/index.js';

// One instance per process. esbuild-wasm does not support two.
let pending: Promise<EsbuildApi> | undefined;

export async function loadEsbuild(): Promise<EsbuildApi> {
  pending ??= import('esbuild-wasm');

  return pending;
}
