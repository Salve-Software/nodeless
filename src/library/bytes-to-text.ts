const decoder = new TextDecoder();

export function bytesToText(bytes: Uint8Array): string {
  return decoder.decode(bytes);
}
