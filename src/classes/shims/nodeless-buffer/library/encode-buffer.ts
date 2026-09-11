import type { BufferEncoding } from '@/classes/shims/nodeless-buffer/types/index.js';
import { bytesToBase64, bytesToText } from '@/library/index.js';

export function encodeBuffer(bytes: Uint8Array, encoding: BufferEncoding): string {
  if (encoding === 'base64') return bytesToBase64(bytes);
  if (encoding === 'hex') {
    return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  if (encoding === 'ascii' || encoding === 'latin1' || encoding === 'binary') {
    return String.fromCharCode(...bytes);
  }

  return bytesToText(bytes);
}
