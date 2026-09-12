import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const ROUTES = ['docs', 'playground'];

/**
 * GitHub Pages has no rewrite rule. `404.html` catches anything else, but every route gets a
 * real file so a deep link answers 200 instead of logging an error and confusing a crawler.
 */
function staticRoutes(): Plugin {
  return {
    name: 'static-routes',
    closeBundle() {
      copyFileSync('dist/index.html', 'dist/404.html');

      for (const route of ROUTES) {
        mkdirSync(`dist/${route}`, { recursive: true });
        copyFileSync('dist/index.html', `dist/${route}/index.html`);
      }
    },
  };
}

/**
 * The playground runs the library's config graph in a Worker, and that worker entry is a
 * file the browser fetches. It is copied out of the library's own build, so the site always
 * demos the code in this repository.
 */
function copyRuntimeWorker(): Plugin {
  return {
    name: 'copy-runtime-worker',
    buildStart() {
      mkdirSync('public', { recursive: true });
      copyFileSync('../dist/runtime-worker.js', 'public/runtime-worker.js');
    },
  };
}

// The site is served from a project page, so every asset needs the repository prefix.
// `BASE_PATH=/` builds it for a custom domain instead.
export default defineConfig({
  base: process.env['BASE_PATH'] ?? '/nodeless/',
  plugins: [react(), copyRuntimeWorker(), staticRoutes()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: { outDir: 'dist', assetsDir: 'assets', sourcemap: false },
});
