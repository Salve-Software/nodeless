import { NodelessBuffer } from '@/classes/shims/nodeless-buffer/nodeless-buffer.class.js';

/** Retypes bytes in place, so a buffer is always a real `Uint8Array` and never a copy. */
export function wrapBuffer(bytes: Uint8Array): NodelessBuffer {
  return Object.setPrototypeOf(bytes, NodelessBuffer.prototype) as NodelessBuffer;
}
