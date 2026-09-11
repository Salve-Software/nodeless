import type { ShimModule } from '@/classes/shims/node-shims/types/index.js';
import {
  allocBuffer,
  bufferByteLength,
  concatBuffers,
  fromBuffer,
  isBuffer,
  NodelessBuffer,
} from '@/classes/shims/nodeless-buffer/index.js';

/**
 * `from` has to shadow `Uint8Array.from`, which would otherwise win the overload and hand
 * back a plain `Uint8Array` whose `toString` takes no encoding.
 */
export function createBufferShim(): ShimModule {
  const Buffer = Object.assign(NodelessBuffer, {
    from: fromBuffer,
    alloc: allocBuffer,
    allocUnsafe: (size: number) => allocBuffer(size),
    concat: concatBuffers,
    byteLength: bufferByteLength,
    isBuffer,
  }) as unknown as ShimModule;

  return { Buffer, default: { Buffer }, kMaxLength: 2 ** 32 };
}
