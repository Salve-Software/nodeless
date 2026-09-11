# Bundler

`esbuild-wasm`, which runs the same in Node and in the browser. In Node you can inject the
native `esbuild` through the same API (`createProject({ esbuild })`) once those ~200 ms start to
hurt.

## The plugin is the filesystem

esbuild-wasm sees no disk at all. The `nodeless-vfs` plugin is what makes the build exist:

- **`onResolve`** with the `/.*/` filter — catches everything, entry point included, and calls
  the resolver. `file` becomes a path in the VFS namespace; `external` is flagged; `empty` goes
  to a namespace that loads `export default {}`.
- **`onLoad`** in the VFS namespace — reads the bytes and picks the loader by extension.

An unknown extension falls to the `text` loader. **Never** to `js`: a file the library cannot
interpret must not become code.

## Configuration, and what each choice buys

```ts
{
  entryPoints: { bundle: entry },   // where bundle.js and bundle.css come from
  bundle: true,
  format: 'esm',
  platform: 'browser',
  jsx: 'automatic',                 // React 17+; imports react/jsx-runtime
  target: 'es2020',
  write: false,                     // there is no disk to write to
  absWorkingDir: '/',
  logLevel: 'silent',               // messages come back in BuildResult, not on stdout
  define: { 'process.env.NODE_ENV': '"production"' },
}
```

`minify` and `sourcemap` follow `mode`: production minifies and emits no map; development does
the opposite, with an inline sourcemap so it fits in the iframe without a second file.

esbuild handles CJS/ESM interop on its own, and that is what lets the real `react-dom` be
bundled with no configuration at all.

## An error is data

`build()` returns `{ ok: false, errors }`; it never throws. Each error becomes
`{ text, file, line, column, lineText }` — a shape a caller can act on without parsing a stack
trace. An exception would lose the position.

A missing entry point is caught before esbuild is even called, and the message says what was
expected.

## The `index.html`

The scaffold's `index.html` points at the source (`<script type="module" src="/src/main.tsx">`).
The dist has to point at the bundle. `renderIndexHtml` strips the module scripts, injects the
bundle `<script>` before `</body>` and the CSS `<link>` before `</head>` — the latter only when
the build emitted CSS.

A project with no `index.html` gets a minimal document carrying `<div id="root">`, which is what
every React scaffold expects.

## `dispose()` does not stop esbuild

The WASM instance is one per process and shared by every `NodelessProject`. Stopping esbuild in
one of them would break the others. `dispose()` drops the resolution cache; call
`esbuild.stop()` yourself if you want the compiler torn down.

## `build()` does not write to the VFS

If it wrote to `/dist`, every build would fire the watcher, which would fire another build. The
result comes back in memory, with keys relative to `outdir`: `index.html`, `bundle.js`,
`bundle.css`.
