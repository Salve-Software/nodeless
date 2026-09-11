import type { NodelessBuffer } from '@/classes/shims/nodeless-buffer/nodeless-buffer.class.js';
import { wrapBuffer } from './wrap-buffer.js';

export function concatBuffers(parts: Uint8Array[], total?: number): NodelessBuffer {
  const size = total ?? parts.reduce((sum, part) => sum + part.length, 0);
  const merged = new Uint8Array(size);
  let offset = 0;

  for (const part of parts) {
    if (offset >= size) break;
    merged.set(part.subarray(0, size - offset), offset);
    offset += part.length;
  }

  return wrapBuffer(merged);
}
