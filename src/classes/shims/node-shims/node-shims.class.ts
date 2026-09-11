import type { NodeShimsOptions, ShimModule } from './types/index.js';
import { DEFAULT_CWD, TEMP_DIR, UNSUPPORTED_BUILTINS } from './constants/index.js';
import {
  createAssertShim,
  createBufferShim,
  createCryptoShim,
  createEventsShim,
  createFsShim,
  createModuleShim,
  createOsShim,
  createPathShim,
  createProcessShim,
  createQuerystringShim,
  createStringDecoderShim,
  createTimersShim,
  createUnsupportedShim,
  createUrlShim,
  createUtilShim,
  missingRequire,
  toVfsPath,
} from './library/index.js';

/**
 * The Node standard library, over the VFS. This is the closed set the architecture bets on:
 * a toolchain that needs only these runs without nodeless knowing anything about it.
 */
export class NodeShims {
  private readonly modules: Record<string, ShimModule> = {};
  private cwd: string;

  constructor({
    vfs,
    cwd = DEFAULT_CWD,
    env = {},
    require = missingRequire,
  }: NodeShimsOptions) {
    this.cwd = cwd;

    const toPath = (path: unknown): string => toVfsPath(path, this.cwd);

    this.modules['assert'] = createAssertShim();
    this.modules['buffer'] = createBufferShim();
    this.modules['console'] = { ...console, default: console };
    this.modules['constants'] = { default: {} };
    this.modules['crypto'] = createCryptoShim();
    this.modules['events'] = createEventsShim();
    this.modules['fs'] = createFsShim({ vfs, toPath });
    this.modules['os'] = createOsShim(TEMP_DIR);
    this.modules['path'] = createPathShim(() => this.cwd);
    this.modules['process'] = createProcessShim({
      cwd: () => this.cwd,
      env,
      chdir: (path) => (this.cwd = toPath(path)),
    });
    this.modules['querystring'] = createQuerystringShim();
    this.modules['string_decoder'] = createStringDecoderShim();
    this.modules['timers'] = createTimersShim();
    this.modules['url'] = createUrlShim();
    this.modules['util'] = createUtilShim();

    for (const name of UNSUPPORTED_BUILTINS) {
      this.modules[name] ??= createUnsupportedShim(name);
    }

    this.modules['fs/promises'] = this.namespaceOf('fs', 'promises');
    this.modules['path/posix'] = this.modules['path'] ?? {};
    this.modules['util/types'] = this.namespaceOf('util', 'types');
    this.modules['timers/promises'] = this.modules['timers'] ?? {};
    // Registered before the shim is built, so `isBuiltin('module')` is true of itself.
    this.modules['module'] = {};
    this.modules['module'] = createModuleShim({ require, builtins: this.names() });
  }

  get(name: string): ShimModule | undefined {
    return this.modules[name.replace(/^node:/, '')];
  }

  has(name: string): boolean {
    return this.get(name) !== undefined;
  }

  names(): string[] {
    return Object.keys(this.modules).sort();
  }

  private namespaceOf(module: string, property: string): ShimModule {
    return (this.modules[module]?.[property] ?? {}) as ShimModule;
  }
}
