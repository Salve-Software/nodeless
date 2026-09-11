import type { ShimModule } from './shim-module.js';

/** What `createRequire` hands the toolchain. The runtime supplies the implementation. */
export type ShimRequire = (specifier: string, importer: string) => ShimModule;
