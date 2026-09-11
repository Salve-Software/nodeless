const encoder = new TextEncoder();

export function textToBytes(text: string): Uint8Array {
  return encoder.encode(text);
}
