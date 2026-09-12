import { describe, expect, it } from 'vitest';
import { sealProcess, WorkerHandler } from '@/classes/runtime/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';

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

describe('installGlobals', () => {
  it('replaces the realm process with the shim, and follows an init', async () => {
    const handler = new WorkerHandler();
    const scope: Record<string, unknown> = { process: { cwd: () => '/host' } };

    handler.installGlobals(scope);

    await handler.handle({
      id: 1,
      type: 'init',
      snapshot: new MemoryVfs().snapshot(),
      cwd: '/project',
      env: { FROM: 'the runtime' },
      conditions: [],
    });

    const shimmed = scope['process'] as {
      cwd: () => string;
      env: Record<string, string>;
    };

    expect(shimmed.cwd()).toBe('/project');
    expect(shimmed.env).toEqual({ FROM: 'the runtime' });
  });

  it('leaves no way to put the real one back', () => {
    const scope: Record<string, unknown> = {};

    new WorkerHandler().installGlobals(scope);

    expect(() => Object.defineProperty(scope, 'process', { value: 1 })).toThrowError();
  });
});
