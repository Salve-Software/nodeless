import { describe, expect, it } from 'vitest';
import {
  deserializeRemote,
  serializeRemote,
} from '@/classes/runtime/worker-runtime/library/index.js';

function roundTrip(value: unknown): { sent: unknown; calls: [number, unknown[]][] } {
  const functions = new Map<number, (...args: unknown[]) => unknown>();
  const calls: [number, unknown[]][] = [];
  let next = 0;
  const sent = serializeRemote(value, {
    register: (fn) => {
      next += 1;
      functions.set(next, fn);

      return next;
    },
    seen: new WeakSet(),
    depth: 0,
  });

  return {
    sent: deserializeRemote(sent, async (handle, args) => {
      calls.push([handle, args]);

      return functions.get(handle)?.(...args);
    }),
    calls,
  };
}

describe('serializeRemote', () => {
  it('leaves data alone', () => {
    expect(roundTrip({ a: 1, b: 'two', c: [true, null] }).sent).toEqual({
      a: 1,
      b: 'two',
      c: [true, null],
    });
  });

  it('turns a function into a handle that calls back', async () => {
    const { sent, calls } = roundTrip({ shout: (text: string) => `${text}!` });
    const shout = (sent as { shout: (text: string) => Promise<string> }).shout;

    await expect(shout('hi')).resolves.toBe('hi!');
    expect(calls).toEqual([[1, ['hi']]]);
  });

  it('reaches a function nested in an array, which is where plugins live', async () => {
    const { sent } = roundTrip({
      plugins: [{ name: 'a', transform: (code: string) => `${code}+a` }],
    });
    const plugin = (
      sent as { plugins: { name: string; transform: (c: string) => Promise<string> }[] }
    ).plugins[0];

    expect(plugin?.name).toBe('a');
    await expect(plugin?.transform('x')).resolves.toBe('x+a');
  });

  it('does not loop on a value that points at itself', () => {
    const cyclic: Record<string, unknown> = { name: 'a' };

    cyclic['self'] = cyclic;

    expect(roundTrip(cyclic).sent).toEqual({ name: 'a', self: undefined });
  });

  it('passes bytes through rather than walking them', () => {
    const bytes = new Uint8Array([1, 2, 3]);

    expect(roundTrip({ bytes }).sent).toEqual({ bytes });
  });
});
