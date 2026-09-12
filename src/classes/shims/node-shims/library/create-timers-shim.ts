import type { ShimModule } from '@/classes/shims/node-shims/types/index.js';
import { setImmediate } from './set-immediate.js';

export function createTimersShim(): ShimModule {
  const shim: ShimModule = {
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    setImmediate,
    clearImmediate: clearTimeout,
  };

  shim['default'] = shim;

  return shim;
}
