import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The site is served from a project page, so every asset needs the repository prefix.
// `BASE_PATH=/` builds it for a custom domain instead.
export default defineConfig({
  base: process.env['BASE_PATH'] ?? '/nodeless/',
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: { outDir: 'dist', assetsDir: 'assets', sourcemap: false },
});
