import type { NodelessBuffer } from '@/classes/shims/nodeless-buffer/nodeless-buffer.class.js';
import type {
  BufferEncoding,
  BufferSource,
} from '@/classes/shims/nodeless-buffer/types/index.js';
import { decodeBuffer } from './decode-buffer.js';
import { wrapBuffer } from './wrap-buffer.js';

export function fromBuffer(
  value: BufferSource,
  encoding: BufferEncoding = 'utf8',
): NodelessBuffer {
  if (typeof value === 'string') return wrapBuffer(decodeBuffer(value, encoding));
  if (value instanceof ArrayBuffer) return wrapBuffer(new Uint8Array(value));

  return wrapBuffer(Uint8Array.from(value as ArrayLike<number>));
}
