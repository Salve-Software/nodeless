import { rotateRight } from './rotate-right.js';

/** Expands a 64-byte block into the 64-word message schedule. */
export function sha256Schedule(block: DataView, offset: number): Uint32Array {
  const schedule = new Uint32Array(64);

  for (let i = 0; i < 16; i += 1) schedule[i] = block.getUint32(offset + i * 4, false);

  for (let i = 16; i < 64; i += 1) {
    const previous = schedule[i - 15] ?? 0;
    const recent = schedule[i - 2] ?? 0;
    const s0 = rotateRight(previous, 7) ^ rotateRight(previous, 18) ^ (previous >>> 3);
    const s1 = rotateRight(recent, 17) ^ rotateRight(recent, 19) ^ (recent >>> 10);

    schedule[i] = ((schedule[i - 16] ?? 0) + s0 + (schedule[i - 7] ?? 0) + s1) >>> 0;
  }

  return schedule;
}
