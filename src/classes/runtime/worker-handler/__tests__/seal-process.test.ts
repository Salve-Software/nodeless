import { describe, expect, it } from 'vitest';
import { sealProcess } from '@/classes/runtime/index.js';

describe('sealProcess', () => {
  it('removes the members that hand back a native module', () => {
    const scope = {
      process: {
        binding: () => undefined,
        dlopen: () => undefined,
        kill: () => undefined,
        nextTick: () => undefined,
        env: {},
      },
    };

    expect(sealProcess(scope).sort()).toEqual(['binding', 'dlopen', 'kill']);
    expect(scope.process.binding).toBeUndefined();
    expect(scope.process.dlopen).toBeUndefined();
    expect(scope.process.kill).toBeUndefined();
  });

  // Node's own internals use these, so taking them would break the worker rather than seal it.
  it('leaves nextTick, env and the rest of the surface alone', () => {
    const nextTick = (): void => undefined;
    const scope = { process: { binding: () => undefined, nextTick, env: { A: '1' } } };

    sealProcess(scope);

    expect(scope.process.nextTick).toBe(nextTick);
    expect(scope.process.env).toEqual({ A: '1' });
  });

  it('does nothing in a browser, where there is no process to seal', () => {
    expect(sealProcess({})).toEqual([]);
    expect(sealProcess({ process: undefined })).toEqual([]);
  });

  it('makes the removal stick', () => {
    const scope = { process: { binding: () => undefined } };

    sealProcess(scope);

    expect(() =>
      Object.defineProperty(scope.process, 'binding', { value: () => 1 }),
    ).toThrowError();
  });
});
