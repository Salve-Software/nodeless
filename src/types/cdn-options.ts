/** Where a bare import goes when nothing in the VFS resolves it. */
export interface CdnOptions {
  /** Origin of an npm-to-ESM CDN, such as `https://esm.sh`. */
  url: string;
  /** Ranges to pin against, normally the `dependencies` of the project. */
  dependencies?: Record<string, string>;
}
