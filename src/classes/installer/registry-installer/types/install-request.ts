/** One edge of the dependency graph still to walk. */
export interface InstallRequest {
  name: string;
  range: string;
  /** Directory whose `node_modules` holds the dependent, so nesting knows where to go. */
  parentDir: string;
}
