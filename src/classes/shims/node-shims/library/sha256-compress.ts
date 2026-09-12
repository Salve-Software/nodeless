import type { Sha256State } from '@/classes/shims/node-shims/types/index.js';
import { SHA256_ROUND_CONSTANTS } from '@/classes/shims/node-shims/constants/index.js';
import { rotateRight } from './rotate-right.js';

/** Folds one 64-byte block into the state, in place. */
export function sha256Compress(state: Sha256State, schedule: Uint32Array): void {
  let [a, b, c, d, e, f, g, h] = state;

  for (let round = 0; round < 64; round += 1) {
    const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
    const choice = (e & f) ^ (~e & g);
    const constant = SHA256_ROUND_CONSTANTS[round] ?? 0;
    const t1 = (h + s1 + choice + constant + (schedule[round] ?? 0)) >>> 0;
    const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
    const majority = (a & b) ^ (a & c) ^ (b & c);
    const t2 = (s0 + majority) >>> 0;

    h = g;
    g = f;
    f = e;
    e = (d + t1) >>> 0;
    d = c;
    c = b;
    b = a;
    a = (t1 + t2) >>> 0;
  }

  const next: Sha256State = [a, b, c, d, e, f, g, h];

  for (let i = 0; i < state.length; i += 1) state[i] = (state[i]! + next[i]!) >>> 0;
}
