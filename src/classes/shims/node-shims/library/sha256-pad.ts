/** Appends the `0x80` marker and the 64-bit big-endian bit length, to a 64-byte boundary. */
export function sha256Pad(bytes: Uint8Array): Uint8Array {
  const total = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(total);
  const view = new DataView(padded.buffer);
  const bits = bytes.length * 8;

  padded.set(bytes);
  padded[bytes.length] = 0x80;
  view.setUint32(total - 8, Math.floor(bits / 2 ** 32), false);
  view.setUint32(total - 4, bits >>> 0, false);

  return padded;
}
