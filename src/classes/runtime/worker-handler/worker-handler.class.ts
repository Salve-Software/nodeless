import type { WorkerHandlerOptions } from './types/index.js';
import type {
  WorkerRequest,
  WorkerResponse,
} from '@/classes/runtime/worker-runtime/types/index.js';
import type { PluginContext, RuntimeModule } from '@/types/index.js';
import { NodeResolver } from '@/classes/resolver/index.js';
import { evaluateModule } from '@/classes/runtime/module-runtime/library/index.js';
import { serializeRemote } from '@/classes/runtime/worker-runtime/library/index.js';
import { NodeShims } from '@/classes/shims/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';
import { DEFAULT_CONDITIONS, ROOT_PATH } from '@/constants/index.js';
import { tryResolve } from '@/library/index.js';
import { applyVfsPatch, toErrorResponse } from './library/index.js';

/**
 * The worker half. It owns a filesystem of its own, so nothing it runs can reach the page:
 * no DOM, no `localStorage`, and whatever globals the bootstrap deleted before calling in.
 */
export class WorkerHandler {
  private readonly options: WorkerHandlerOptions;
  private readonly functions = new Map<number, (...args: unknown[]) => unknown>();
  private vfs = new MemoryVfs();
  private shims: NodeShims;
  private resolver: NodeResolver;
  private nextHandle = 0;

  constructor(options: WorkerHandlerOptions = {}) {
    this.options = options;
    this.shims = this.createShims();
    this.resolver = this.createResolver();
  }

  /**
   * Replaces the realm's `process` with the shim, as a getter so it follows `init` and
   * `reset`. Structural rather than enumerative: there is no real process to reach, instead
   * of a real one with its dangerous members removed one by one.
   */
  installGlobals(scope: Record<string, unknown>): void {
    try {
      Object.defineProperty(scope, 'process', {
        get: () => this.shims.get('process'),
        configurable: false,
      });
    } catch {
      // Already non-configurable. `sealProcess` is what covers the realm in that case.
    }
  }

  async handle(request: WorkerRequest): Promise<WorkerResponse> {
    try {
      return { id: request.id, ok: true, value: await this.run(request) };
    } catch (error) {
      return toErrorResponse(request.id, error);
    }
  }

  private async run(request: WorkerRequest): Promise<unknown> {
    if (request.type === 'init') {
      this.vfs = new MemoryVfs({ snapshot: request.snapshot });
      this.options.cwd = request.cwd;
      this.options.env = request.env;
      this.options.conditions = request.conditions;
      this.reset();

      return undefined;
    }
    if (request.type === 'patch') {
      applyVfsPatch(this.vfs, request);
      this.resolver.invalidate();

      return undefined;
    }
    if (request.type === 'reset') {
      this.reset();

      return undefined;
    }
    if (request.type === 'evaluate') {
      const module = evaluateModule({
        code: request.code,
        path: request.path,
        host: {
          shim: (name) => this.shims.get(name) ?? {},
          require: (name) => this.requireShim(name),
        },
      });

      return this.serialize(module);
    }

    const fn = this.functions.get(request.handle);

    if (!fn) throw new Error(`No such handle: ${String(request.handle)}`);

    return this.serialize(await fn.apply(this.context(), request.args));
  }

  private serialize(value: unknown): unknown {
    return serializeRemote(value, {
      register: (fn) => this.register(fn),
      seen: new WeakSet(),
      depth: 0,
    });
  }

  private register(fn: (...args: unknown[]) => unknown): number {
    this.nextHandle += 1;
    this.functions.set(this.nextHandle, fn);

    return this.nextHandle;
  }

  private context(): PluginContext {
    return {
      vfs: this.vfs,
      resolve: (source, importer) =>
        tryResolve(this.resolver, { specifier: source, importer }),
    };
  }

  private requireShim(specifier: string): RuntimeModule {
    const shim = this.shims.get(specifier);

    if (shim) return shim;

    throw new Error(
      `require("${specifier}") at run time is not supported: the config graph is bundled ahead of evaluation, so only a static import can be resolved.`,
    );
  }

  private reset(): void {
    this.functions.clear();
    this.nextHandle = 0;
    this.shims = this.createShims();
    this.resolver = this.createResolver();
  }

  private createShims(): NodeShims {
    return new NodeShims({
      vfs: this.vfs,
      cwd: this.options.cwd ?? ROOT_PATH,
      env: this.options.env ?? {},
      require: (specifier) => this.requireShim(specifier),
    });
  }

  private createResolver(): NodeResolver {
    return new NodeResolver({
      vfs: this.vfs,
      conditions: this.options.conditions ?? DEFAULT_CONDITIONS,
    });
  }
}
