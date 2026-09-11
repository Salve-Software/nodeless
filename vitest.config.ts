import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@example': fileURLToPath(new URL('./example', import.meta.url)),
    },
  },
  test: {
    name: 'unit',
    include: ['src/**/__tests__/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: true,
    // esbuild-wasm initializes once per process and takes seconds the first time.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
