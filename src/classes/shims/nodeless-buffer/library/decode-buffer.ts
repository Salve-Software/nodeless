import type { BufferEncoding } from '@/classes/shims/nodeless-buffer/types/index.js';
import { base64ToBytes, textToBytes } from '@/library/index.js';

export function decodeBuffer(value: string, encoding: BufferEncoding): Uint8Array {
  if (encoding === 'base64') return base64ToBytes(value);
  if (encoding === 'hex') {
    return Uint8Array.from(value.match(/.{1,2}/g) ?? [], (pair) => parseInt(pair, 16));
  }
  if (encoding === 'ascii' || encoding === 'latin1' || encoding === 'binary') {
    return Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff);
  }

  return textToBytes(value);
}
