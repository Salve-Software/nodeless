/** One package that landed in the VFS, and where it landed. */
export interface InstalledPackage {
  name: string;
  version: string;
  dir: string;
  resolved: string;
  integrity?: string;
  peerDependencies: Record<string, string>;
  optionalPeers: Set<string>;
}
