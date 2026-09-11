import type { ShimModule } from '@/classes/shims/node-shims/types/index.js';

/** `platform: 'browser'` is the truth on both sides: there is no operating system here. */
export function createProcessShim({
  cwd,
  env,
  chdir,
}: {
  cwd: () => string;
  env: Record<string, string>;
  chdir: (path: string) => void;
}): ShimModule {
  const noop = (): void => undefined;
  const stream = { write: () => true, isTTY: false, columns: 80, on: noop, end: noop };
  const shim: ShimModule = {
    env,
    cwd,
    argv: ['node', 'nodeless'],
    argv0: 'node',
    execPath: '/usr/bin/node',
    platform: 'browser',
    arch: 'wasm32',
    version: 'v22.0.0',
    versions: { node: '22.0.0', v8: '0.0.0' },
    pid: 1,
    ppid: 0,
    browser: true,
    stdout: stream,
    stderr: stream,
    stdin: { ...stream, isTTY: false },
    nextTick: (callback: (...args: unknown[]) => void, ...args: unknown[]) => {
      queueMicrotask(() => callback(...args));
    },
    hrtime: Object.assign(() => [0, 0], { bigint: () => BigInt(Date.now()) * 1000000n }),
    uptime: () => 0,
    memoryUsage: () => ({ heapUsed: 0, heapTotal: 0, rss: 0, external: 0 }),
    emitWarning: noop,
    on: () => shim,
    once: () => shim,
    off: () => shim,
    removeListener: () => shim,
    setMaxListeners: noop,
    chdir,
    umask: () => 0,
    exit: (code?: number) => {
      throw new Error(`process.exit(${String(code ?? 0)}) during a build`);
    },
  };

  shim['default'] = shim;

  return shim;
}
