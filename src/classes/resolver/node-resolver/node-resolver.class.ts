import type {
  NodeResolverOptions,
  PackageManifest,
  PathMapping,
  ResolveScope,
} from './types/index.js';
import type { ResolveRequest, ResolveResult, Resolver } from '@/types/index.js';
import { DEFAULT_CONDITIONS } from '@/constants/index.js';
import { normalizePath } from '@/library/index.js';
import { RESOLVE_EXTENSIONS } from './constants/index.js';
import {
  readManifest,
  readTsconfigPaths,
  resolveSpecifier,
  toAliasMappings,
} from './library/index.js';

/** Node resolution over the VFS, caching `package.json` per directory. */
export class NodeResolver implements Resolver {
  private readonly manifests = new Map<string, PackageManifest | undefined>();
  private readonly aliases: PathMapping[];
  private paths: PathMapping[] | undefined;
  private readonly scope: ResolveScope;

  constructor({
    vfs,
    conditions = DEFAULT_CONDITIONS,
    aliases = [],
  }: NodeResolverOptions) {
    this.aliases = toAliasMappings(aliases);
    this.scope = {
      vfs,
      conditions,
      extensions: RESOLVE_EXTENSIONS,
      paths: [],
      readManifest: (dir) => this.manifestOf(dir),
    };
  }

  resolve(request: ResolveRequest): ResolveResult {
    this.paths ??= [...this.aliases, ...readTsconfigPaths(this.scope.vfs)];
    this.scope.paths = this.paths;

    return resolveSpecifier(this.scope, request);
  }

  /** The VFS changes between builds; without this the second build sees the old `node_modules`. */
  invalidate(): void {
    this.manifests.clear();
    this.paths = undefined;
  }

  private manifestOf(dir: string): PackageManifest | undefined {
    const key = normalizePath(dir);

    if (this.manifests.has(key)) return this.manifests.get(key);

    const manifest = readManifest(this.scope.vfs, key);

    this.manifests.set(key, manifest);

    return manifest;
  }
}
