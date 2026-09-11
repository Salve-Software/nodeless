import type { NodelessBuffer } from '@/classes/shims/nodeless-buffer/nodeless-buffer.class.js';
import { wrapBuffer } from './wrap-buffer.js';

export function allocBuffer(size: number, fill = 0): NodelessBuffer {
  return wrapBuffer(new Uint8Array(size).fill(fill));
}
