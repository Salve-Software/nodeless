<h1 align="center">nodeless</h1>

<p align="center">
  <strong>npm install and a React build, without Node</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/@salve-software/nodeless.svg?style=flat-square" alt="Version">
  <img src="https://img.shields.io/npm/dm/@salve-software/nodeless.svg?style=flat-square" alt="Downloads">
  <img src="https://img.shields.io/badge/runs%20in-node%20%2B%20browser-61dafb?style=flat-square" alt="Node and browser">
  <img src="https://img.shields.io/badge/VM-none-brightgreen?style=flat-square" alt="No VM">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License">
</p>

You hand nodeless a map of files. It resolves the `dependencies` against the npm registry,
unpacks the tarballs, and gives you back `index.html`, `bundle.js` and `bundle.css` — in memory,
in the same process. No shell, no filesystem, no child process, no VM.

The usual way to build on demand is to hand the sources to a container. That is cold start and
cost for something that is, at bottom, a text transformation: a bundler reads files, resolves
imports, transpiles and concatenates — it never runs the code it is bundling, and unpacking a
tarball does not either. nodeless drops the machine and keeps the build. Because it does, the
same code runs on your server and in your user's browser.

<p align="center">
  <img src="./assets/playground.png" alt="The playground: an editor on the left, the built app running on the right" width="900">
</p>

```ts
import { NodelessProject } from '@salve-software/nodeless';

const project = new NodelessProject({
  files: {
    '/package.json': '{ "dependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" } }',
    '/src/main.tsx': "import { createRoot } from 'react-dom/client'; /* … */",
  },
});

await project.install(); // registry → .tgz → /node_modules, in memory

const result = await project.build();

if (result.ok) {
  iframe.srcdoc = new TextDecoder().decode(result.files['index.html']);
} else {
  console.error(result.errors); // { text, file, line, column }
}
```

## Features

- **No VM, no filesystem.** Nothing from the project you are building is ever executed — not
  during `install()`, not during `build()`. No `postinstall`, no `package.json` scripts, no
  `eval`. The isolation does not come from a sandbox; it comes from there being no execution.
- **A real npm install.** Packument, `semver` ranges, tarballs verified against the integrity the
  registry published, npm's flat layout with nesting on conflict, and a lockfile.
- **The same code on both sides.** One build output, four bare imports, all resolvable through an
  import map. A headless Chromium job in CI opens the playground, installs from
  registry.npmjs.org and checks the iframe really executes the result.
- **Errors are data.** A failing build returns `{ ok: false, errors }` with file, line and column
  instead of throwing, so whatever called it can act on the position.
- **Fast enough to skip the dev server.** A React scaffold builds in ~200 ms warm, so preview is
  build plus iframe. `watch()` debounces the VFS and rebuilds.
- **CSS modules, and Tailwind if you want it.** `*.module.css` is scoped automatically;
  `cssTransform` hands every stylesheet to PostCSS — which is how Tailwind v3 runs here without
  becoming a dependency of this package.
- **Preview before installing.** `build({ cdn })` turns a bare import nothing resolved into a
  pinned CDN URL, so a first render can happen while `install()` is still running.

## Installation

### Requirements

| Component          | Requirement                                                         |
| ------------------ | ------------------------------------------------------------------- |
| Node               | 20 or higher, **or** any browser with `fetch` and WebAssembly       |
| Packages you build | **pure JS** — no native bindings, no lifecycle scripts              |
| In the browser     | a `wasmURL` for `esbuild.wasm`, and an import map for the four deps |

```bash
npm install @salve-software/nodeless
```

## Usage

### Building

```ts
const result = await project.build({ mode: 'development' });
```

`files` comes back as `Record<string, Uint8Array>` — `index.html` rewritten to point at the
bundle, `bundle.js`, and `bundle.css` when there is any. **`build()` does not write to the VFS**,
which is what lets `watch()` run without a build firing itself.

| Option       | Default                            |
| ------------ | ---------------------------------- |
| `entry`      | the first `src/main.*` that exists |
| `mode`       | `'production'`                     |
| `html`       | `/index.html`                      |
| `outdir`     | `/dist`                            |
| `target`     | `'es2020'`                         |
| `conditions` | `browser, import, module, default` |
| `external`   | `[]`                               |
| `cdn`        | off                                |

`mode: 'development'` turns minification off and inline sourcemaps on.

### Installing

```ts
const { installed, warnings, lockfile } = await project.install();
```

Reads `dependencies` from `/package.json`, resolves every range, and writes the packages to
`/node_modules` with npm's flat layout — nesting a copy under its dependent when versions clash.
Peer dependencies are reported in `warnings`, never installed. Only registry ranges are
supported: `npm:`, `file:` and `git+https:` are refused rather than guessed.

### In the browser

The published `dist/` has four bare imports and no bundling step, so an import map is enough:

```html
<script type="importmap">
  {
    "imports": {
      "esbuild-wasm": "https://unpkg.com/esbuild-wasm@0.25.12/esm/browser.min.js",
      "resolve.exports": "https://esm.sh/resolve.exports@2.0.3",
      "semver": "https://esm.sh/semver@7.8.5",
      "fflate": "https://esm.sh/fflate@0.8.3"
    }
  }
</script>
```

```ts
const project = new NodelessProject({
  files,
  wasmURL: `https://unpkg.com/esbuild-wasm@${esbuild.version}/esbuild.wasm`,
});
```

esbuild-wasm already runs its own worker, so the build does not block the UI.

### Public surface

`NodelessProject` is the only runtime export — the class is how the library is used. The types
come along because they are the contract: `Vfs`, `Bundler` and `Installer` are ports, so you can
hand the constructor your own implementation without importing ours.

## Playground

```bash
npm run playground
```

An editor with a live preview beside it. It installs from registry.npmjs.org **in your browser**,
builds there, and renders the result — no `node_modules` anywhere. See
[`example/`](example/README.md) for the other three examples.

## What it does not do

Native bindings (`.node`), `package.json` scripts, `postinstall`, Rolldown, lightningcss,
`sharp`, embedded `sass`, Tailwind v4, React Refresh.

**None of that is a backlog.** The first four follow from the premise: if the library executed
code, it would need isolation, and isolation is the cost it exists to remove. The reasoning for
each one is in
[`docs/design/06-scope-and-limits.md`](docs/design/06-scope-and-limits.md).

## Documentation

[`docs/design/`](docs/design/README.md) holds the decisions rather than the description — why a
build needs no VM, why the VFS is synchronous, how the resolver handles `exports` and the
`browser` field, how the installer hoists.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, branch and commit
conventions, and how PRs work here.

## License

This project is licensed under the MIT License, see [LICENSE](./LICENSE) for details.

<p align="center">
  Made by Salve Software
</p>
