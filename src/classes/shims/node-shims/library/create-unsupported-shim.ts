import type { ShimModule } from '@/classes/shims/node-shims/types/index.js';

/**
 * Importing a process-shaped builtin is fine — a dead code path does it all the time.
 * Calling into one is not, and the message says which module and why.
 *
 * The prototype is a second Proxy because esbuild's CommonJS interop rebuilds the namespace
 * with `Object.create(getPrototypeOf(mod))` and copies own keys, of which a Proxy has none.
 */
export function createUnsupportedShim(name: string): ShimModule {
  const fail = (): never => {
    throw new Error(
      `node:${name} is not available: nodeless builds in-process, with no OS underneath. The toolchain reached for it at build time.`,
    );
  };
  const members = new Proxy(
    {},
    { get: (_target, property) => (property === '__esModule' ? true : fail) },
  );

  return new Proxy(
    {},
    {
      get: (_target, property) => (property === '__esModule' ? true : fail),
      getPrototypeOf: () => members,
    },
  );
}
