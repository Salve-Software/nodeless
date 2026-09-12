import { isBuffer } from '@/classes/shims/nodeless-buffer/index.js';

export function stringifyValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.stack ?? value.message;
  if (isBuffer(value)) return `<Buffer ${value.toString('hex')}>`;

  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}
