import type { ResolveRequest } from './resolve-request.js';
import type { ResolveResult } from './resolve-result.js';

/** Node resolution over the VFS. Throws `ResolveError` when nothing matches. */
export interface Resolver {
  resolve(request: ResolveRequest): ResolveResult;
  invalidate?(): void;
}
