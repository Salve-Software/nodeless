import type {
  WorkerCommand,
  WorkerResponse,
  WorkerRuntimeOptions,
} from './types/index.js';
import type {
  Disposer,
  EsbuildApi,
  Resolver,
  Runtime,
  RuntimeChannel,
  RuntimeModule,
  Vfs,
} from '@/types/index.js';
import { bundleModule } from '@/classes/runtime/module-runtime/library/index.js';
import { NodeShims } from '@/classes/shims/index.js';
import { DEFAULT_CONDITIONS, ROOT_PATH } from '@/constants/index.js';
import { RuntimeError } from '@/errors/index.js';
import {
  collectVfsPatch,
  createWorkerChannel,
  defaultWorkerUrl,
  deserializeRemote,
} from './library/index.js';

/**
 * The hardened runtime. Same bundling as `ModuleRuntime`, but the evaluation happens in a
 * Worker: no DOM, no `localStorage`, no `document.cookie`, and no reference to anything the
 * page holds. What crosses back is data, with every function replaced by a call over the wire.
 */
export class WorkerRuntime implements Runtime {
  private readonly vfs: Vfs;
  private readonly resolver: Resolver;
  private readonly shims: NodeShims;
  private readonly esbuild: EsbuildApi | undefined;
  private readonly wasmURL: string | undefined;
  private readonly options: WorkerRuntimeOptions;
  private readonly pending = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  >();
  private readonly dirty = { written: new Set<string>(), removed: new Set<string>() };
  private readonly modules = new Map<string, Promise<RuntimeModule>>();
  private readonly unwatch: Disposer;
  private channel: RuntimeChannel | undefined;
  private unlisten: Disposer | undefined;
  private started: Promise<void> | undefined;
  private disposed = false;
  private nextId = 0;

  constructor(options: WorkerRuntimeOptions) {
    this.options = options;
    this.vfs = options.vfs;
    this.resolver = options.resolver;
    this.esbuild = options.esbuild;
    this.wasmURL = options.wasmURL;
    // Built on this side only to answer "is this a builtin" while bundling; the worker
    // makes its own over its own filesystem, and that is the one anything actually calls.
    this.shims = new NodeShims({ vfs: options.vfs });
    this.unwatch = this.vfs.watch((event) => {
      const bucket = event.type === 'remove' ? this.dirty.removed : this.dirty.written;

      bucket.add(event.path);
    });
  }

  async import(path: string): Promise<RuntimeModule> {
    if (this.disposed) throw new RuntimeError('The runtime worker was disposed', {});

    const pending = this.modules.get(path) ?? this.evaluate(path);

    this.modules.set(path, pending);

    return pending;
  }

  invalidate(): void {
    this.modules.clear();
    this.resolver.invalidate?.();
    if (this.channel) void this.send({ type: 'reset' });
  }

  async dispose(): Promise<void> {
    this.disposed = true;
    this.unwatch();
    this.unlisten?.();
    this.channel?.terminate();
    this.channel = undefined;
    this.started = undefined;
    this.modules.clear();

    for (const { reject } of this.pending.values()) {
      reject(new RuntimeError('The runtime worker was disposed', {}));
    }
    this.pending.clear();
  }

  private async evaluate(path: string): Promise<RuntimeModule> {
    await this.start();
    await this.flush();

    const code = await bundleModule(
      {
        vfs: this.vfs,
        resolver: this.resolver,
        isShimmed: (specifier) => this.shims.has(specifier),
        ...(this.esbuild === undefined ? {} : { esbuild: this.esbuild }),
        ...(this.wasmURL === undefined ? {} : { wasmURL: this.wasmURL }),
      },
      path,
    );
    return this.receive(
      await this.send({ type: 'evaluate', path, code }),
    ) as RuntimeModule;
  }

  /**
   * A hook can run long after the module was evaluated, and the sources it reads through
   * `this.vfs` will have changed by then. Every call flushes first, for the same reason a
   * build does.
   */
  private async call(handle: number, args: unknown[]): Promise<unknown> {
    if (this.disposed) throw new RuntimeError('The runtime worker was disposed', {});

    await this.flush();

    // The result gets the same treatment as an evaluation: `defineConfig(fn)` returns the
    // config from a call, and the plugins in it are functions like any other.
    return this.receive(await this.send({ type: 'call', handle, args }));
  }

  private receive(value: unknown): unknown {
    return deserializeRemote(value, (handle, args) => this.call(handle, args));
  }

  private async start(): Promise<void> {
    this.started ??= this.connect();

    return this.started;
  }

  private async connect(): Promise<void> {
    const channel =
      this.options.channel?.() ??
      createWorkerChannel(this.options.workerUrl ?? defaultWorkerUrl());

    this.channel = channel;
    this.unlisten = channel.listen((message) => this.settle(message as WorkerResponse));
    this.dirty.written.clear();
    this.dirty.removed.clear();

    await this.send({
      type: 'init',
      snapshot: this.vfs.snapshot(),
      cwd: this.options.cwd ?? ROOT_PATH,
      env: this.options.env ?? {},
      conditions: this.options.conditions ?? DEFAULT_CONDITIONS,
    });
  }

  private async flush(): Promise<void> {
    if (this.dirty.written.size === 0 && this.dirty.removed.size === 0) return;

    const patch = collectVfsPatch(this.vfs, this.dirty);

    this.dirty.written.clear();
    this.dirty.removed.clear();

    await this.send({ type: 'patch', ...patch });
  }

  private async send(command: WorkerCommand): Promise<unknown> {
    const channel = this.channel;

    if (!channel) throw new RuntimeError('The runtime worker is not running', {});

    this.nextId += 1;

    const id = this.nextId;

    return new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      channel.post({ ...command, id });
    });
  }

  private settle(response: WorkerResponse): void {
    const waiting = this.pending.get(response.id);

    if (!waiting) return;

    this.pending.delete(response.id);

    if (response.ok) {
      waiting.resolve(response.value);
      return;
    }

    waiting.reject(
      new RuntimeError(response.message, {
        ...(response.stack === undefined ? {} : { stack: response.stack }),
      }),
    );
  }
}
