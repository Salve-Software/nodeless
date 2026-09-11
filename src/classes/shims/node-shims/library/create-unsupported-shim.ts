import type { ShimModule } from '@/classes/shims/node-shims/types/index.js';

/**
 * Importing a process-shaped builtin is fine — a dead code path does it all the time.
 * Calling into one is not, and the message says which module and why.
 */
export function createUnsupportedShim(name: string): ShimModule {
  const fail = (): never => {
    throw new Error(
      `node:${name} is not available: nodeless builds in-process, with no OS underneath. The toolchain reached for it at build time.`,
    );
  };

  return new Proxy(
    {},
    {
      get: (_target, property) => {
        if (property === 'default') return fail;
        if (property === '__esModule') return true;

        return fail;
      },
    },
  );
}
