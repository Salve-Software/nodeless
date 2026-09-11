/** The project the playground opens with. It lives in the VFS, never on disk. */
export const STARTER = {
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

  '/index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
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

  '/src/App.tsx': `import { useState } from 'react';

const STACK = ['no shell', 'no disk', 'no child process', 'no VM'];

export function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="card">
      <h1>Built in your browser</h1>
      <p>
        React came off the npm registry, was unpacked in memory, and bundled here —
        nothing touched a filesystem.
      </p>

      <ul>
        {STACK.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <button type="button" onClick={() => setCount((value) => value + 1)}>
        clicked {count} {count === 1 ? 'time' : 'times'}
      </button>

      <small>Edit this file and hit Build.</small>
    </main>
  );
}
`,

  '/src/app.css': `:root {
  color-scheme: light;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

body {
  background: #f6f7f9;
  display: grid;
  margin: 0;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
}

.card {
  background: #fff;
  border: 1px solid #e6e8ec;
  border-radius: 16px;
  box-shadow: 0 1px 2px #0d121c0a, 0 12px 32px -12px #0d121c1f;
  display: grid;
  gap: 14px;
  max-width: 420px;
  padding: 30px 32px;
}

h1 {
  font-size: 21px;
  letter-spacing: -0.02em;
  margin: 0;
}

p {
  color: #5b6472;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

ul {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  list-style: none;
  margin: 0;
  padding: 0;
}

li {
  background: #f1f3f6;
  border-radius: 999px;
  color: #47505f;
  font-size: 12px;
  padding: 5px 11px;
}

button {
  background: #111726;
  border: none;
  border-radius: 9px;
  color: #fff;
  cursor: pointer;
  font: 500 14px inherit;
  justify-self: start;
  padding: 9px 18px;
  transition: transform 0.08s ease;
}

button:active {
  transform: scale(0.97);
}

small {
  color: #97a0ae;
  font-size: 12px;
}
`,
};
