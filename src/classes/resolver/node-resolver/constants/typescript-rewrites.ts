/**
 * In an ESM project TypeScript tells you to import `./x.js` for a file named `./x.ts`.
 * Without this, no TypeScript scaffold on `moduleResolution: NodeNext` resolves at all.
 */
export const TYPESCRIPT_REWRITES: Record<string, string[]> = {
  '.js': ['.ts', '.tsx'],
  '.jsx': ['.tsx'],
  '.mjs': ['.mts'],
  '.cjs': ['.cts'],
};
