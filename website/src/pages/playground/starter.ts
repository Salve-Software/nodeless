/** Small on purpose: two packages install in a couple of seconds over a phone connection. */
export const STARTER: Record<string, string> = {
  '/package.json': JSON.stringify(
    {
      name: 'playground',
      private: true,
      type: 'module',
      dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
    },
    null,
    2,
  ),

  '/vite.config.ts': `import { readFileSync } from 'node:fs';

// This file runs in a Worker in your browser. \`node:fs\` is the virtual filesystem:
// there is no disk under this tab.
const pkg = JSON.parse(readFileSync('/package.json', 'utf8'));

export default ({ mode }: { mode: string }) => ({
  define: {
    __PROJECT__: JSON.stringify(pkg.name),
    __MODE__: JSON.stringify(mode),
  },
  plugins: [
    {
      name: 'built-by',
      resolveId: (id: string) => (id === 'virtual:info' ? '/virtual/info.js' : null),
      load: (id: string) =>
        id === '/virtual/info.js' ? \`export const info = 'a virtual module';\` : null,
    },
  ],
});
`,

  '/src/App.tsx': `import { useState } from 'react';
import { info } from 'virtual:info';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="card">
      <h1>Built in your browser</h1>
      <p>
        React came off the npm registry, was unpacked in memory and bundled here.
        Nothing touched a filesystem.
      </p>

      <button type="button" onClick={() => setCount((n) => n + 1)}>
        clicked {count} {count === 1 ? 'time' : 'times'}
      </button>

      <small>
        {info} · project {__PROJECT__} · {__MODE__}
      </small>
    </main>
  );
}
`,

  '/src/main.tsx': `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import './app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`,

  '/src/app.css': `:root {
  color-scheme: dark;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #0d1016;
  color: #e9edf5;
}

.card {
  width: min(30rem, 100% - 3rem);
  padding: 2rem;
  border: 1px solid #1e2530;
  border-radius: 1rem;
  background: #11151d;
}

h1 {
  margin: 0 0 0.75rem;
  font-size: 1.5rem;
  letter-spacing: -0.02em;
}

p {
  margin: 0 0 1.5rem;
  color: #98a2b6;
  line-height: 1.6;
}

button {
  padding: 0.6rem 1.1rem;
  border: none;
  border-radius: 0.5rem;
  background: #8ce04a;
  color: #06210a;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

small {
  display: block;
  margin-top: 1.25rem;
  color: #626d81;
  font-size: 0.8rem;
}
`,

  '/index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>preview</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`,
};

export const FILE_ORDER = [
  '/src/App.tsx',
  '/src/main.tsx',
  '/src/app.css',
  '/vite.config.ts',
  '/package.json',
];
