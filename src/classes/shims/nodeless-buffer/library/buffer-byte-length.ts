import type { BufferEncoding } from '@/classes/shims/nodeless-buffer/types/index.js';
import { decodeBuffer } from './decode-buffer.js';

export function bufferByteLength(
  value: string | Uint8Array,
  encoding: BufferEncoding = 'utf8',
): number {
  return typeof value === 'string' ? decodeBuffer(value, encoding).length : value.length;
}
