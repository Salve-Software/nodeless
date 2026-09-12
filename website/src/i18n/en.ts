export const en = {
  nav: {
    docs: 'Docs',
    github: 'GitHub',
    npm: 'npm',
    theme: 'Toggle theme',
    language: 'Change language',
  },
  hero: {
    badge: 'v0.2 — runs the project’s own Vite config',
    title: ['Build a frontend project.', 'Without Node.'],
    lead: 'nodeless installs from npm and produces your `dist/` in memory, in the process you already have — on a server or inside a browser tab. No shell, no filesystem, no container.',
    install: 'npm install @salve-software/nodeless',
    copy: 'Copy',
    copied: 'Copied',
    primary: 'Read the docs',
    secondary: 'Open the playground',
    stats: [
      { value: '~200', unit: 'ms', label: 'warm React build' },
      { value: '4', unit: '', label: 'runtime dependencies' },
      { value: '0', unit: '', label: 'containers to operate' },
    ],
  },
  insight: {
    eyebrow: 'The idea',
    title: 'A build never runs your app',
    lead: 'Bundling is reading files, resolving imports and turning TSX into JS. Your components only run later, in the browser of whoever opens the site. The container everyone spins up is isolating something that was never executing.',
    rows: [
      {
        job: 'A place to read and write files',
        vm: 'no',
        note: 'an object in memory does it',
      },
      { job: 'npm install and the build', vm: 'no', note: 'both fit in this process' },
      {
        job: 'Isolating the generated code',
        vm: 'no',
        note: 'bundling does not execute',
      },
    ],
    vmLabel: 'Needs a VM?',
  },
  graphs: {
    eyebrow: 'How it holds together',
    title: 'Two sets of files that never touch',
    lead: 'A project has a toolchain and an application, and the import edges already separate them. Nothing has to decide which side a file is on.',
    toolchain: {
      title: 'The toolchain',
      verdict: 'Executed, in a sandbox',
      note: 'A build tool that does not run is a build tool you have to reimplement — once per tool, forever.',
      files: [
        'vite.config.ts',
        '@vitejs/plugin-react',
        '@tailwindcss/vite',
        'your-own-plugin.js',
      ],
    },
    app: {
      title: 'Your application',
      verdict: 'Read as text. Never executed.',
      note: 'Resolving an import and transpiling TSX do not run anything. This half is why no VM is needed.',
      files: ['index.html', 'src/main.tsx', 'src/App.tsx', 'react, react-dom'],
    },
    footnote:
      '`App.tsx` is never imported by `vite.config.ts`. `react` is not either — it is imported by `App.tsx`, which is the other side.',
  },
  code: {
    eyebrow: 'In practice',
    title: 'Three lines on either side of the wire',
    lead: 'The same package, the same API. What changes is who is calling it.',
    tabs: [
      {
        id: 'api',
        label: 'In your API',
        file: 'controller.ts',
        note: 'Returns a built site from a request handler, with nothing to provision.',
        code: `import { NodelessProject } from '@salve-software/nodeless';

export async function build(files: Record<string, string>) {
  const project = new NodelessProject({ files, isolation: 'none' });

  await project.install();          // registry → tarball → memory
  const result = await project.build();

  if (!result.ok) return { errors: result.errors };

  return result.files;              // index.html, bundle.js, bundle.css
}`,
      },
      {
        id: 'browser',
        label: 'In the browser',
        file: 'editor.tsx',
        note: 'Rebuilds as the user types. The toolchain runs in a worker, off the page.',
        code: `const project = new NodelessProject({
  files: STARTER,
  wasmURL: 'https://unpkg.com/esbuild-wasm/esbuild.wasm',
  isolation: 'worker',
});

project.watch(async () => {
  const result = await project.build({ mode: 'development' });

  if (result.ok) iframe.srcdoc = decode(result.files['index.html']);
});`,
      },
      {
        id: 'config',
        label: 'The project’s config',
        file: 'vite.config.ts',
        note: '`node:fs` here is the virtual filesystem. The plugin never finds out.',
        code: `import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';

const pkg = JSON.parse(readFileSync('/package.json', 'utf8'));

export default ({ mode }) => ({
  plugins: [react(), tailwind()],
  define: { __VERSION__: JSON.stringify(pkg.version) },
  resolve: { alias: { '~': '/src' } },
});`,
      },
    ],
  },
  features: {
    eyebrow: 'What you get',
    title: 'Everything a build needs, none of the machinery',
    items: [
      {
        title: 'A real npm install',
        body: 'Semver ranges, integrity checks, npm’s flat layout, a lockfile, workspaces. Straight from registry.npmjs.org into memory.',
      },
      {
        title: 'Your own Vite config',
        body: 'Plugins from npm, virtual modules, `define`, `resolve.alias` and `defineConfig(({ mode }) => …)`. A tool we have never heard of costs no code here.',
      },
      {
        title: 'Runs in the browser',
        body: 'A headless Chromium job proves it end to end on every commit: it installs from npm in a tab, builds, and the iframe executes the result.',
      },
      {
        title: 'Errors are data',
        body: 'A failed build returns `{ ok: false, errors }` with file, line and column. Nothing throws, so the caller can act on it.',
      },
      {
        title: 'Toolchains just work',
        body: 'Tailwind v4 and Sass compile with no configuration, as optional peers loaded only when a file needs them. CSS modules are built in.',
      },
      {
        title: 'Move it across the wire',
        body: '`snapshot()` serialises the whole workspace. Install on the server, rebuild in the browser, get the identical bundle.',
      },
    ],
  },
  isolation: {
    eyebrow: 'Running someone else’s config',
    title: 'A separate realm, or none at all',
    lead: 'A config is code. If your users write it, it is a stranger’s code running next to yours. `isolation: worker` puts it in a realm of its own — and there is a test in CI that tries to break out of it.',
    columns: {
      probe: 'What the config tries',
      none: 'isolation: none',
      worker: 'isolation: worker',
    },
    probes: [
      { probe: 'Read the API environment', none: 'hunter2', worker: 'blocked' },
      { probe: 'Count the API environment', none: '76 keys', worker: '0 keys' },
      { probe: 'Get a native fs binding', none: 'reached', worker: 'blocked' },
      { probe: 'Get a way to spawn', none: 'reached', worker: 'blocked' },
      { probe: 'Kill the host process', none: 'reached', worker: 'blocked' },
      { probe: 'Learn the host cwd', none: 'reached', worker: 'blocked' },
      { probe: 'Learn the node binary', none: 'reached', worker: 'blocked' },
    ],
    note: "`isolation: none` is the default and is not a weak sandbox — it is `require('./vite.config.js')`, which is completely safe for a config you wrote.",
  },
  compare: {
    eyebrow: 'Where it sits',
    title: 'Not a container, not an emulator',
    items: [
      {
        title: 'A container per build',
        body: 'Provision, boot, mount, tear down. Seconds of latency and a fleet to operate, to isolate a step that was never executing anything.',
        verdict: 'What this replaces',
        tone: 'muted',
      },
      {
        title: 'nodeless',
        body: 'A library call. In memory, in the process you already have, and the identical code path in a browser tab. Out comes a dist.',
        verdict: 'A function call',
        tone: 'accent',
      },
      {
        title: 'A Node emulator',
        body: 'Shells, dev servers and HMR in the browser. A bigger surface, a different goal, and browser-only — it produces no build artifact.',
        verdict: 'A different product',
        tone: 'muted',
      },
    ],
  },
  faq: {
    eyebrow: 'Questions',
    title: 'The ones that come up',
    items: [
      {
        q: 'How can a build work without Node?',
        a: 'Because a build is text in and text out. It reads files, resolves every import down to `node_modules`, turns TSX into JS and concatenates. None of that executes your components — they run later, in the browser of whoever opens the site.',
      },
      {
        q: 'So how do Vite plugins run, then?',
        a: 'They run, and that is the point. A project has two sets of files: the toolchain and the application. The toolchain is executed, in a sandbox where `node:fs` is the in-memory filesystem. The application is only ever read.',
      },
      {
        q: 'Does it run `postinstall`?',
        a: 'No, and it never will. Installing is downloading a tarball and unpacking it. If a package needs a lifecycle script to be usable, it is out of scope by construction.',
      },
      {
        q: 'What about packages with native bindings?',
        a: 'They cannot work here — they need a process with `dlopen`, and there is none. A package with a WASM build can be mapped to it; one without cannot run.',
      },
      {
        q: 'Is it safe to run untrusted projects?',
        a: 'The application half, yes — it never executes. For the config half, use `isolation: worker`, which runs it in a separate realm with no DOM, no network and none of your environment. CI has seven probes that try to escape it.',
      },
      {
        q: 'Can it build Next.js?',
        a: 'No. Next needs native SWC and a real server. Vite projects are the target, and being compatible with Vite plugins is what makes the rest of the ecosystem work.',
      },
    ],
  },
  cta: {
    title: 'Build it in the tab you already have',
    lead: 'The playground installs React from npm in your browser and rebuilds as you type. Nothing is running on a server.',
    primary: 'Open the playground',
    secondary: 'Read the design docs',
  },
  footer: {
    tagline: 'npm install and a frontend build, in-process.',
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
        title: 'Docs',
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
