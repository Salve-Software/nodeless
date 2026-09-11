/** One `compilerOptions.paths` entry, split around its `*`. */
export interface PathMapping {
  prefix: string;
  suffix: string;
  targets: string[];
}
