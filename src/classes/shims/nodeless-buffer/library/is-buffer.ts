import { NodelessBuffer } from '@/classes/shims/nodeless-buffer/nodeless-buffer.class.js';

export function isBuffer(value: unknown): value is NodelessBuffer {
  return value instanceof NodelessBuffer;
}
