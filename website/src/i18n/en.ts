export const en = {
  nav: {
    home: 'Home',
    docs: 'Docs',
    github: 'GitHub',
    npm: 'npm',
    theme: 'Toggle theme',
    language: 'Change language',
  },

  home: {
    badge: 'v0.2 is out',
    title: 'Build a frontend project without Node',
    lead: 'nodeless installs npm packages and bundles your app in memory. It runs inside your API and inside the browser, with no container to manage.',
    install: 'npm install @salve-software/nodeless',
    copy: 'Copy',
    copied: 'Copied',
    primary: 'Get started',
    secondary: 'View on GitHub',

    stats: [
      { value: '200', unit: 'ms', label: 'to build a React app' },
      { value: '4', unit: '', label: 'dependencies' },
      { value: '0', unit: '', label: 'containers' },
    ],

    cards: [
      {
        title: 'A real npm install',
        body: 'Semver ranges, integrity checks and a lockfile. Straight from the registry into memory.',
      },
      {
        title: 'Your Vite config runs',
        body: 'Plugins, aliases and define work the way they already do in your project.',
      },
      {
        title: 'One package, both sides',
        body: 'The same code runs on your server and in a browser tab.',
      },
      {
        title: 'Errors come back as data',
        body: 'A failed build returns file, line and column. Nothing throws.',
      },
    ],

    why: {
      eyebrow: 'How it works',
      title: 'A bundler never runs your app',
      body: 'It reads your files and rewrites them. Your components run later, in the browser of whoever opens the site. That step never needed a container.',
      link: 'Read the details',
      toolchain: {
        title: 'Build tools',
        verdict: 'Run, in a sandbox',
        files: ['vite.config.ts', '@vitejs/plugin-react', '@tailwindcss/vite'],
      },
      app: {
        title: 'Your app',
        verdict: 'Only read',
        files: ['src/main.tsx', 'src/App.tsx', 'react, react-dom'],
      },
      note: 'Your app is never imported by your config. The two never meet.',
    },

    sample: {
      eyebrow: 'In your API',
      title: 'Three calls and you have a dist',
      file: 'controller.ts',
      code: `import { NodelessProject } from '@salve-software/nodeless';

const project = new NodelessProject({ files, isolation: 'none' });

await project.install();
const result = await project.build();

result.files; // index.html, bundle.js, bundle.css`,
    },

    cta: {
      title: 'Try it in your browser',
      body: 'The playground installs React from npm in your tab and rebuilds as you type.',
      primary: 'Open the playground',
      secondary: 'Read the docs',
    },
  },

  docs: {
    title: 'Docs',
    subtitle: 'Install it, build something, then wire it up the way you need.',
    onThisPage: 'On this page',
    more: 'Design notes',
    sections: [
      {
        id: 'install',
        title: 'Installation',
        body: 'Node 20 or newer, or any browser with fetch and WebAssembly.',
        code: 'npm install @salve-software/nodeless',
        lang: 'bash',
      },
      {
        id: 'quick-start',
        title: 'Quick start',
        body: 'Give it a map of files. You get back index.html, bundle.js and bundle.css as bytes.',
        code: `import { NodelessProject } from '@salve-software/nodeless';

const project = new NodelessProject({
  files: {
    '/package.json': '{ "dependencies": { "react": "^19.0.0" } }',
    '/src/main.tsx': "import { createRoot } from 'react-dom/client';",
  },
  isolation: 'none',
});

await project.install();

const result = await project.build();

if (result.ok) {
  writeSomewhere(result.files);
} else {
  console.error(result.errors);
}`,
      },
      {
        id: 'browser',
        title: 'In the browser',
        body: 'Pass a wasmURL for esbuild and the rest is the same. Use watch to rebuild as files change.',
        code: `const project = new NodelessProject({
  files: STARTER,
  wasmURL: 'https://unpkg.com/esbuild-wasm/esbuild.wasm',
  isolation: 'worker',
});

project.watch(async () => {
  const result = await project.build({ mode: 'development' });

  if (result.ok) {
    iframe.srcdoc = new TextDecoder().decode(result.files['index.html']);
  }
});`,
      },
      {
        id: 'config',
        title: 'Project config',
        body: 'If the project has a vite.config.ts, nodeless runs it. Plugins from npm, virtual modules, define and resolve.alias all work. node:fs inside a plugin reads the virtual filesystem.',
        code: `import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';

const pkg = JSON.parse(readFileSync('/package.json', 'utf8'));

export default ({ mode }) => ({
  plugins: [react()],
  define: { __VERSION__: JSON.stringify(pkg.version) },
  resolve: { alias: { '~': '/src' } },
});`,
      },
      {
        id: 'isolation',
        title: 'Isolation',
        body: 'A config is code. Use none when you wrote it, which is the same as requiring it yourself. Use worker when your users write it, and it runs in a separate realm with no DOM, no network and none of your environment.',
        code: `// Browser
new NodelessProject({ files, isolation: 'worker' });

// Server
import { createNodeChannel } from '@salve-software/nodeless/node';

new NodelessProject({ files, isolation: 'worker', channel: createNodeChannel });`,
      },
      {
        id: 'errors',
        title: 'Errors',
        body: 'build never throws on a bad project. It returns a result you can branch on.',
        code: `const result = await project.build();

if (!result.ok) {
  for (const error of result.errors) {
    console.log(error.file, error.line, error.text);
  }
}`,
      },
      {
        id: 'options',
        title: 'Build options',
        body: 'Every field overrides one default.',
        table: [
          ['entry', 'first src/main.* that exists'],
          ['mode', "'production'"],
          ['outdir', '/dist'],
          ['target', "'es2020'"],
          ['define', '{}'],
          ['external', '[]'],
          ['publicDir', '/public'],
          ['assetLimit', '4096 bytes'],
          ['env', 'merged into import.meta.env'],
          ['cdn', 'off'],
        ],
      },
      {
        id: 'limits',
        title: 'What it does not do',
        body: 'Packages with native bindings, postinstall scripts, Next.js, and output hooks like generateBundle. The full reasoning is in the design notes.',
      },
    ],
  },

  footer: {
    tagline: 'npm install and a frontend build, in memory.',
    madeBy: 'Made by Salve Software',
    license: 'MIT',
    columns: [
      {
        title: 'Project',
        links: [
          ['GitHub', 'https://github.com/Salve-Software/nodeless'],
          ['npm', 'https://www.npmjs.com/package/@salve-software/nodeless'],
          ['Releases', 'https://github.com/Salve-Software/nodeless/releases'],
        ],
      },
      {
        title: 'Learn',
        links: [
          ['README', 'https://github.com/Salve-Software/nodeless#readme'],
          [
            'Design notes',
            'https://github.com/Salve-Software/nodeless/tree/main/docs/design',
          ],
          ['Examples', 'https://github.com/Salve-Software/nodeless/tree/main/example'],
        ],
      },
      {
        title: 'More',
        links: [
          ['Issues', 'https://github.com/Salve-Software/nodeless/issues'],
          [
            'Contributing',
            'https://github.com/Salve-Software/nodeless/blob/main/CONTRIBUTING.md',
          ],
          ['Salve Software', 'https://github.com/Salve-Software'],
        ],
      },
    ],
  },
} as const;
