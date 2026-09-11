/** Loaders whose content is text a transform might rewrite. Assets are left alone. */
export const TRANSFORMABLE_LOADERS = new Set<string>([
  'css',
  'local-css',
  'global-css',
  'js',
  'jsx',
  'ts',
  'tsx',
  'json',
  'text',
]);
