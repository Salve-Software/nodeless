import { copyFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/** GitHub Pages has no rewrite rule, so a deep link is served the same shell through 404. */
function spaFallback(): Plugin {
  return {
    name: 'spa-fallback',
    closeBundle() {
      copyFileSync('dist/index.html', 'dist/404.html');
    },
  };
}

// The site is served from a project page, so every asset needs the repository prefix.
// `BASE_PATH=/` builds it for a custom domain instead.
export default defineConfig({
  base: process.env['BASE_PATH'] ?? '/nodeless/',
  plugins: [react(), spaFallback()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: { outDir: 'dist', assetsDir: 'assets', sourcemap: false },
});
