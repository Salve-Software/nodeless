import type { ResolveRequest, Resolver } from '@/types/index.js';

/** Asking about something that does not exist gives undefined, which is what a hook expects. */
export function tryResolve(
  resolver: Resolver,
  request: ResolveRequest,
): string | undefined {
  try {
    const result = resolver.resolve(request);

    return result.kind === 'file' ? result.path : undefined;
  } catch {
    return undefined;
  }
}
