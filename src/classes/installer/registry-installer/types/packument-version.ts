/** One version inside a packument, reduced to what installing needs. */
export interface PackumentVersion {
  version: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
  dist: { tarball: string; integrity?: string };
}
