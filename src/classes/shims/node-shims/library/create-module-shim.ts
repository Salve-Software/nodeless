import type { ShimModule } from '@/classes/shims/node-shims/types/index.js';

/** `createRequire` hands the toolchain a `require` that goes back through the resolver. */
export function createModuleShim({
  require,
  builtins,
}: {
  require: (specifier: string, importer: string) => ShimModule;
  builtins: string[];
}): ShimModule {
  const createRequire = (from: string | URL = '/'): unknown => {
    const importer = from instanceof URL ? from.href : from;
    const required = (specifier: string): ShimModule => require(specifier, importer);

    return Object.assign(required, {
      resolve: (specifier: string) => specifier,
      cache: {},
      main: undefined,
      extensions: {},
    });
  };

  const shim: ShimModule = {
    createRequire,
    createRequireFromPath: createRequire,
    builtinModules: builtins,
    isBuiltin: (name: string) => builtins.includes(name.replace(/^node:/, '')),
    register: () => undefined,
    syncBuiltinESMExports: () => undefined,
    Module: { createRequire, builtinModules: builtins },
  };

  shim['default'] = shim;

  return shim;
}
