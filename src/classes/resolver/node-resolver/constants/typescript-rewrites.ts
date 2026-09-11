/** In an ESM project TypeScript tells you to import `./x.js` for a file named `./x.ts`. */
export const TYPESCRIPT_REWRITES: Record<string, string[]> = {
  '.js': ['.ts', '.tsx'],
  '.jsx': ['.tsx'],
  '.mjs': ['.mts'],
  '.cjs': ['.cts'],
};
