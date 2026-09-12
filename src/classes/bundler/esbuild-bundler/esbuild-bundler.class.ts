import type { EsbuildBundlerOptions } from './types/index.js';
import type { PluginContainer } from '@/classes/plugin/index.js';
import type {
  BuildMessage,
  BuildOptions,
  BuildResult,
  Bundler,
  EsbuildApi,
  Resolver,
  Vfs,
} from '@/types/index.js';
import { ROOT_PATH } from '@/constants/index.js';
import {
  bytesToText,
  initializeEsbuild,
  loadEsbuild,
  normalizePath,
  textToBytes,
} from '@/library/index.js';
import {
  ASSET_NAMES,
  BUNDLE_NAME,
  DEFAULT_ASSET_LIMIT,
  DEFAULT_HTML_PATH,
  DEFAULT_OUTDIR,
  DEFAULT_PUBLIC_DIR,
  DEFAULT_TARGET,
} from './constants/index.js';
import {
  buildImportMetaEnv,
  collectOutputs,
  collectPublicFiles,
  createVfsPlugin,
  entryNotFound,
  readDependencies,
  renderIndexHtml,
  resolveEntry,
  toBuildMessage,
  toFailureMessages,
} from './library/index.js';

/** esbuild-wasm over the VFS. Bundling is text transformation — nothing in the project runs. */
export class EsbuildBundler implements Bundler {
  private readonly vfs: Vfs;
  private readonly resolver: Resolver;
  private readonly esbuild: EsbuildApi | undefined;
  private readonly wasmURL: string | undefined;
  private readonly container: PluginContainer | undefined;

  constructor({ vfs, resolver, esbuild, wasmURL, container }: EsbuildBundlerOptions) {
    this.vfs = vfs;
    this.resolver = resolver;
    this.esbuild = esbuild;
    this.wasmURL = wasmURL;
    this.container = container;
  }

  async build(options: BuildOptions = {}): Promise<BuildResult> {
    const startedAt = Date.now();
    const warnings: BuildMessage[] = [];
    const outdir = normalizePath(options.outdir ?? DEFAULT_OUTDIR);
    const entry = resolveEntry(this.vfs, options.entry);

    if (entry === undefined) {
      return {
        ok: false,
        errors: [{ text: entryNotFound(options.entry) }],
        warnings,
        durationMs: Date.now() - startedAt,
      };
    }

    this.resolver.invalidate?.();

    try {
      const api = await this.api();
      const mode = options.mode ?? 'production';
      const env = buildImportMetaEnv(mode, options.env);

      await this.container?.configResolved({
        root: ROOT_PATH,
        mode,
        entry,
        outdir,
        env: options.env ?? {},
      });
      const result = await api.build({
        entryPoints: { [BUNDLE_NAME]: entry },
        bundle: true,
        write: false,
        outdir,
        absWorkingDir: ROOT_PATH,
        format: 'esm',
        platform: 'browser',
        target: options.target ?? DEFAULT_TARGET,
        jsx: 'automatic',
        logLevel: 'silent',
        assetNames: ASSET_NAMES,
        minify: options.minify ?? mode === 'production',
        sourcemap: (options.sourcemap ?? mode === 'development') ? 'inline' : false,
        define: {
          'process.env.NODE_ENV': JSON.stringify(mode),
          'import.meta.env': JSON.stringify(env),
          ...options.define,
        },
        plugins: [
          ...(options.plugins ?? []),
          createVfsPlugin({
            vfs: this.vfs,
            resolver: this.resolver,
            external: options.external ?? [],
            warnings,
            ...(this.container === undefined ? {} : { container: this.container }),
            assetLimit: options.assetLimit ?? DEFAULT_ASSET_LIMIT,
            ...(options.cdn === undefined
              ? {}
              : {
                  cdn: {
                    ...options.cdn,
                    dependencies: options.cdn.dependencies ?? readDependencies(this.vfs),
                  },
                }),
          }),
        ],
      });

      warnings.push(...result.warnings.map(toBuildMessage));

      // public/ first, so a real build output always wins a name collision.
      const files = {
        ...collectPublicFiles(this.vfs, options.publicDir ?? DEFAULT_PUBLIC_DIR),
        ...collectOutputs(result.outputFiles ?? [], outdir),
      };

      files['index.html'] = textToBytes(
        renderIndexHtml(this.htmlTemplate(options.html), {
          script: `./${BUNDLE_NAME}.js`,
          ...(files[`${BUNDLE_NAME}.css`] ? { style: `./${BUNDLE_NAME}.css` } : {}),
        }),
      );

      return { ok: true, files, warnings, durationMs: Date.now() - startedAt };
    } catch (error) {
      return {
        ok: false,
        errors: toFailureMessages(error),
        warnings,
        durationMs: Date.now() - startedAt,
      };
    }
  }

  /** Drops the resolution cache. Does not stop esbuild: the WASM instance is process-wide. */
  async dispose(): Promise<void> {
    this.resolver.invalidate?.();
  }

  private async api(): Promise<EsbuildApi> {
    const api = this.esbuild ?? (await loadEsbuild());

    await initializeEsbuild(api, this.wasmURL);

    return api;
  }

  private htmlTemplate(html: string | undefined): string | undefined {
    const path = normalizePath(html ?? DEFAULT_HTML_PATH);
    const bytes = this.vfs.tryReadFile(path);

    return bytes && bytesToText(bytes);
  }
}
