import type { ResolvedPackage } from './resolved-package.js';

/** Either a package to install or the reason it was skipped. Never a half-filled one. */
export type ResolveOutcome =
  { ok: true; package: ResolvedPackage } | { ok: false; warning: string };
