import type { ShimModule } from '@/classes/shims/node-shims/types/index.js';

export function createQuerystringShim(): ShimModule {
  const shim: ShimModule = {
    parse: (input: string) => Object.fromEntries(new URLSearchParams(input)),
    stringify: (input: Record<string, string>) => new URLSearchParams(input).toString(),
    escape: encodeURIComponent,
    unescape: decodeURIComponent,
  };

  shim['default'] = shim;

  return shim;
}
