import { HOST_GLOBAL } from '@/classes/runtime/module-runtime/constants/index.js';

/**
 * CommonJS on purpose. esbuild turns a CJS import into a property access at call time, which
 * is the only form that works for a shim whose exports are a Proxy rather than a fixed set.
 */
export function createShimModule(name: string): string {
  return `module.exports = ${HOST_GLOBAL}.shim(${JSON.stringify(name)});`;
}
