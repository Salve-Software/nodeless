import type { Sha256State } from '@/classes/shims/node-shims/types/index.js';
import { SHA256_INITIAL_STATE } from '@/classes/shims/node-shims/constants/index.js';
import { textToBytes } from '@/library/index.js';
import { sha256Compress } from './sha256-compress.js';
import { sha256Pad } from './sha256-pad.js';
import { sha256Schedule } from './sha256-schedule.js';

/** Synchronous because `createHash(...).digest()` is, while WebCrypto's `subtle` is not. */
export function sha256(input: string | Uint8Array): Uint8Array {
  const bytes = typeof input === 'string' ? textToBytes(input) : input;
  const state = [...SHA256_INITIAL_STATE] as Sha256State;
  const padded = sha256Pad(bytes);
  const view = new DataView(padded.buffer, padded.byteOffset, padded.byteLength);

  for (let offset = 0; offset < padded.length; offset += 64) {
    sha256Compress(state, sha256Schedule(view, offset));
  }

  const digest = new Uint8Array(32);
  const out = new DataView(digest.buffer);

  state.forEach((word: number, index: number) =>
    out.setUint32(index * 4, word >>> 0, false),
  );

  return digest;
}
