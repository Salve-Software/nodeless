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
  registryUrl, // defaults to https://registry.npmjs.org
  packageCache, // back the name@version cache with IndexedDB or disk
  fetch, // your own fetch, for an auth header or a proxy
  installer, // your own Installer implementation
});

project.vfs; // readFile, writeFile, readdir, stat, rm, watch…
await project.build(options?); // BuildResult — never throws
project.watch(listener, { debounceMs });
project.snapshot(); // plain JSON, to move between front end and API
await project.install(); // reads /package.json, fills /node_modules
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

### `install()`

```ts
const { installed, warnings, lockfile } = await project.install();
```

Reads `dependencies` from `/package.json` in the VFS, resolves every range against the registry,
downloads and unpacks the tarballs, and writes them to `/node_modules` with npm's flat layout —
nesting a copy under its dependent when versions conflict. It writes `/nodeless-lock.json` and
returns the versions it picked.

**No lifecycle script ever runs.** No `postinstall`, no `prepare`, no binaries. Installing is
downloading and unpacking, which is why no sandbox is needed. Tarball integrity is verified
against what the registry published before anything is unpacked.

`warnings` carries unsatisfied peer dependencies; peers are never installed for you. Only
registry ranges are supported — `npm:`, `file:` and `git+https:` are refused rather than guessed.

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

The published `dist/` has exactly **four** bare imports, and all of them resolve through an
import map — no bundler is needed to use the library on a page:

```html
<script type="importmap">
  {
    "imports": {
      "esbuild-wasm": "https://esm.sh/esbuild-wasm@^0.25.10",
      "resolve.exports": "https://esm.sh/resolve.exports@^2.0.3",
      "semver": "https://esm.sh/semver@^7.8.5",
      "fflate": "https://esm.sh/fflate@^0.8.3"
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

A running example: [`example/browser`](example/README.md) — it installs from the registry in the
browser and rebuilds as you type, with no `node_modules` anywhere.

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

VFS, resolver, bundler and installer are all implemented. Two examples run in CI: one builds a
React scaffold offline in ~200 ms warm, the other installs 36 packages off registry.npmjs.org —
Radix, lucide, zustand, react-router, date-fns, zod — and bundles them in ~1.4 s.

**Not done yet:** CSS modules, Tailwind and React Refresh. Persistent caching is a `PackageCache`
away but has no implementation. The browser page has not been run in an actual browser.

## Development

```bash
npm install
npm test
npm run example         # builds example/app in Node, offline
npm run example:install # installs from the real registry and builds the result
npm run example:browser # serves the page running that same dist/ in a browser
```

| Where                                   | What                                     |
| --------------------------------------- | ---------------------------------------- |
| [`docs/design/`](docs/design/README.md) | the decisions and the reason behind each |
| [`.claude/rules/`](.claude/rules/)      | how to write code here                   |
| [`example/`](example/README.md)         | the scaffold that is also the fixture    |
