import type { ShimModule } from '@/classes/shims/node-shims/types/index.js';
import { SUPPORTED_HASH_ALGORITHMS } from '@/classes/shims/node-shims/constants/index.js';
import { concatBuffers, fromBuffer } from '@/classes/shims/nodeless-buffer/index.js';
import { bytesToBase64 } from '@/library/index.js';
import { sha256 } from './sha256.js';

/** Only sha256, and only because a hash has to be synchronous while WebCrypto is not. */
export function createCryptoShim(): ShimModule {
  const createHash = (algorithm: string): ShimModule => {
    if (!SUPPORTED_HASH_ALGORITHMS.has(algorithm.toLowerCase())) {
      throw new Error(
        `crypto.createHash("${algorithm}") is not shimmed. Only sha256 is, because a synchronous digest has to be implemented by hand.`,
      );
    }

    const chunks: Uint8Array[] = [];
    const hash: ShimModule = {
      update: (data: string | Uint8Array) => {
        chunks.push(typeof data === 'string' ? fromBuffer(data) : data);

        return hash;
      },
      digest: (encoding?: string) => {
        const digest = sha256(concatBuffers(chunks));

        if (encoding === 'hex') return fromBuffer(digest).toString('hex');
        if (encoding === 'base64') return bytesToBase64(digest);

        return fromBuffer(digest);
      },
    };

    return hash;
  };

  const shim: ShimModule = {
    createHash,
    webcrypto: globalThis.crypto,
    subtle: globalThis.crypto.subtle,
    randomUUID: () => globalThis.crypto.randomUUID(),
    getRandomValues: (array: Uint8Array) => globalThis.crypto.getRandomValues(array),
    randomBytes: (size: number) =>
      fromBuffer(globalThis.crypto.getRandomValues(new Uint8Array(size))),
  };

  shim['default'] = shim;

  return shim;
}
