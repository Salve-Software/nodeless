import type { EsbuildApi } from '@/types/index.js';

// `initialize` throws if it is called twice on the same instance.
const started = new WeakMap<EsbuildApi, Promise<void>>();

export async function initializeEsbuild(
  api: EsbuildApi,
  wasmURL: string | undefined,
): Promise<void> {
  const initialize = api.initialize;

  if (!initialize) return;

  const pending =
    started.get(api) ?? initialize(wasmURL === undefined ? {} : { wasmURL });

  started.set(api, pending);

  return pending;
}
