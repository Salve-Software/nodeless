/** A `package.json` narrowed to what resolution reads. */
export interface PackageManifest {
  name?: string;
  version?: string;
  main?: string;
  module?: string;
  browser?: string | Record<string, string | false>;
  exports?: unknown;
  imports?: unknown;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}
