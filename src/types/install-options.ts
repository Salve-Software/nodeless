export interface InstallOptions {
  /**
   * Which `devDependencies` to include. `true` takes all of them, which on a Vite project
   * means vite, eslint and typescript too; a list takes only the ones named.
   */
  dev?: boolean | string[];
}
