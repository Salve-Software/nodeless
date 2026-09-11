import { textToBytes } from './text-to-bytes.js';

export function toBytes(content: string | Uint8Array): Uint8Array {
  return typeof content === 'string' ? textToBytes(content) : content;
}
