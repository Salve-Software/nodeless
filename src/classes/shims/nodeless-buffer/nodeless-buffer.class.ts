import type { BufferEncoding } from './types/index.js';
import { encodeBuffer } from './library/encode-buffer.js';

/**
 * Node's `Buffer` is a `Uint8Array` subclass and the toolchain uses both halves. The statics
 * are assembled in `createBufferShim`: declared here, `from` would clash with `Uint8Array.from`.
 */
export class NodelessBuffer extends Uint8Array {
  toString(encoding: BufferEncoding = 'utf8', start = 0, end = this.length): string {
    return encodeBuffer(this.subarray(start, end), encoding);
  }

  toJSON(): { type: 'Buffer'; data: number[] } {
    return { type: 'Buffer', data: [...this] };
  }

  equals(other: Uint8Array): boolean {
    return this.length === other.length && this.every((byte, i) => byte === other[i]);
  }
}
