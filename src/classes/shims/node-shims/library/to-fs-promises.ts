import type { ShimModule } from '@/classes/shims/node-shims/types/index.js';

/** Every async name is the sync one awaited: the VFS is memory, so nothing actually waits. */
export function toFsPromises(shim: ShimModule): ShimModule {
  const promises: ShimModule = {};

  for (const [name, value] of Object.entries(shim)) {
    if (!name.endsWith('Sync') || typeof value !== 'function') continue;

    const call = value as (...args: unknown[]) => unknown;

    promises[name.slice(0, -'Sync'.length)] = async (...args: unknown[]) => call(...args);
  }

  promises['constants'] = shim['constants'];

  return promises;
}
