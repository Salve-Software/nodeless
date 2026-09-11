import type { LoadedConfig } from '@/types/index.js';

/** A project with no config file builds exactly as it did before there was a runtime. */
export const EMPTY_CONFIG: LoadedConfig = {
  plugins: [],
  define: {},
  aliases: [],
};
