import type { ShimModule } from '@/classes/shims/node-shims/types/index.js';

export function createOsShim(tmpdir: string): ShimModule {
  const shim: ShimModule = {
    EOL: '\n',
    platform: () => 'browser',
    type: () => 'Browser',
    arch: () => 'wasm32',
    release: () => '0.0.0',
    version: () => '0.0.0',
    hostname: () => 'nodeless',
    endianness: () => 'LE',
    tmpdir: () => tmpdir,
    homedir: () => '/',
    cpus: () => [],
    availableParallelism: () => 1,
    totalmem: () => 0,
    freemem: () => 0,
    uptime: () => 0,
    loadavg: () => [0, 0, 0],
    networkInterfaces: () => ({}),
    userInfo: () => ({ username: 'nodeless', homedir: '/', shell: null }),
    devNull: '/dev/null',
  };

  shim['default'] = shim;

  return shim;
}
