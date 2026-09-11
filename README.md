# nodeless

Installs npm dependencies and produces the `dist/` of a React project **without Node**: no
shell, no disk, no child process, no VM. The same code runs on your Node API and in your user's
browser.

```bash
npm install @salve-software/nodeless
```

```ts
import { NodelessProject } from '@salve-software/nodeless';

const project = new NodelessProject({ files }); // { '/src/main.tsx': '…', '/package.json': '…' }
const result = await project.build();

if (!result.ok) {
  console.error(result.errors); // { text, file, line, column }
} else {
  iframe.srcdoc = new TextDecoder().decode(result.files['index.html']);
}
```

## Why this works

A React build is reading files, resolving every `import` down to `node_modules`, transpiling
TSX, concatenating, and emitting JS and CSS. **None of that executes the project's code** — what
executes is the iframe, in the browser. The VM that usually runs `npm run build` is isolating
something that is already harmless, and charging cold start for it.

Details in [`docs/design/01-the-idea.md`](docs/design/01-the-idea.md).

## API

```ts
const project = new NodelessProject({
  files, // Record<string, string | Uint8Array> — sources and node_modules
  snapshot, // or rebuild from a snapshot that arrived over the wire
  vfs, // your own Vfs implementation; takes precedence over files and snapshot
  bundler, // your own Bundler implementation, instead of the esbuild one
  conditions, // exports conditions; defaults to browser, import, module, default
  wasmURL, // required in the browser: where to fetch esbuild.wasm from
  esbuild, // optional in Node: inject the native esbuild and go faster
  installer, // phase 2
});

project.vfs; // readFile, writeFile, readdir, stat, rm, watch…
await project.build(options?); // BuildResult — never throws
project.watch(listener, { debounceMs });
project.snapshot(); // plain JSON, to move between front end and API
await project.install(); // phase 2
```

### `BuildResult`

```ts
type BuildResult =
  | {
      ok: true;
      files: Record<string, Uint8Array>;
      warnings: BuildMessage[];
      durationMs: number;
    }
  | { ok: false; errors: BuildMessage[]; warnings: BuildMessage[]; durationMs: number };
```

`files` holds `index.html`, `bundle.js` and — when there is CSS — `bundle.css`. Your project's
`index.html` is rewritten to point at the bundle. Values are bytes because assets are binary;
decode text with the standard `TextDecoder`.

**`build()` does not write to the VFS.** If it did, `watch` would fire itself.

### `BuildOptions`

| Option       | Default                            |
| ------------ | ---------------------------------- |
| `entry`      | the first `src/main.*` that exists |
| `mode`       | `'production'`                     |
| `html`       | `/index.html`                      |
| `outdir`     | `/dist`                            |
| `target`     | `'es2020'`                         |
| `conditions` | `browser, import, module, default` |
| `external`   | `[]`                               |

`mode: 'development'` turns minification off and inline sourcemaps on.

## In the browser

The published `dist/` has exactly **two** bare imports, and both resolve through an import map —
no bundler is needed to use the library on a page:

```html
<script type="importmap">
  {
    "imports": {
      "esbuild-wasm": "https://esm.sh/esbuild-wasm@^0.25.10",
      "resolve.exports": "https://esm.sh/resolve.exports@^2.0.3"
    }
  }
</script>
<script type="module">
  import * as esbuild from 'esbuild-wasm';
  import { NodelessProject } from '@salve-software/nodeless';

  const project = new NodelessProject({
    snapshot,
    wasmURL: `https://unpkg.com/esbuild-wasm@${esbuild.version}/esbuild.wasm`,
  });
</script>
```

esbuild-wasm already spins up its own Web Worker to compile, so the build does not block the UI.
If you also want the resolver and the VFS off the main thread, put the whole `NodelessProject`
in a worker.

A running example: [`example/browser`](example/README.md).

## Public surface

`NodelessProject` is the only runtime export — the class is how you use the library. There is
no factory function and no second entry point.

The types come along because they are the contract: `BuildResult` to read a build, `Vfs`,
`Bundler` and `Installer` to plug in your own implementation, `NodelessError` to type a caught
error and read its `code`.

Everything else — the VFS, the resolver and the bundler implementations, the path helpers — is
internal and free to change.

## Scope

Works with **pure-JS dependencies**: React, ReactDOM, Radix, shadcn, lucide, zustand, utilities.
TS, TSX, JS, JSX, plain CSS, JSON and assets as data URLs.

Does not work — and will not — with native bindings, `package.json` scripts, `postinstall`, or
anything that needs to execute during the build. That is not a matter of time: it is the
premise. See [`docs/design/06-scope-and-limits.md`](docs/design/06-scope-and-limits.md).

## State

Phases 0 and 1 are done. VFS, full resolver (`exports`, the `browser` field, subpaths,
TypeScript extension rewriting), bundler, structured errors, snapshot and watch — with real
React 19 building in ~200 ms warm.

**The installer is phase 2.** Until then `install()` throws `InstallerNotConfiguredError` and
`node_modules` arrives ready-made in `files`. The contract already exists, and so does the
injection point.

## Development

```bash
npm install
npm test
npm run example         # builds example/app in Node and writes the snapshot
npm run example:browser # serves the page running that same dist/ in a browser
```

| Where                                   | What                                     |
| --------------------------------------- | ---------------------------------------- |
| [`docs/design/`](docs/design/README.md) | the decisions and the reason behind each |
| [`.claude/rules/`](.claude/rules/)      | how to write code here                   |
| [`example/`](example/README.md)         | the scaffold that is also the fixture    |
