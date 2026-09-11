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

## Stylesheets

A file named `*.module.css` goes through esbuild's `local-css` loader instead of `css`, which
scopes the class names and hands the importer a map from the original name to the generated one.
esbuild says nothing when you read a class the stylesheet never defined — it is simply
`undefined` at runtime. That is a trap worth knowing, and there is a test pinning it.

`cssTransform` runs over every stylesheet, modules included, **before** esbuild parses it. It
gets three things: the file, the whole VFS, and a `resolve` rooted at that file.

The VFS is there because the interesting consumer is Tailwind, and Tailwind has to scan the
sources for class names. `resolve` is there because it also has to find its own entry, and
without it every transform would reimplement node resolution.

## Tailwind is the default, not a dependency

A stylesheet carrying `@import 'tailwindcss'` or any other Tailwind directive is compiled with
no configuration, because the promise is "it builds your project", and half of the projects use
Tailwind. Making that work only for callers willing to write forty lines of wiring is a kit, not
a build.

It does not cost the other half anything. `tailwindcss` is an **optional peer**, and the import
only happens once a stylesheet is found to need it. A project with plain CSS never loads it.

The split that makes this honest:

- **the engine comes from the host**, the peer package, which is our dependency and our trust
  level, the same as esbuild;
- **the stylesheets come from the VFS**, so Tailwind has to be installed into the project like
  any other dependency. `install({ dev: ['tailwindcss'] })`.

Executing the project's own copy would be executing project code, which is the one line this
library does not cross. The same reasoning refuses `@plugin` and `@config`: they point at
JavaScript.

Tailwind's own scanner is a native Rust binary. It is avoided by pulling candidate tokens out of
the VFS and handing them over, which is a superset of what `@source` would have asked for.

`cssTransform` still replaces the whole thing for anyone who wants PostCSS or something else.

## Parity with what a Vite project expects

Three things a scaffold assumes, which a bundler alone does not give you:

- **`import.meta.env`** is defined rather than left alone. Untouched it is `undefined` in a plain
  module, so the first line reading an env throws at runtime after a build that passed.
- **`public/`** is copied to the output. The scaffold HTML links straight into it, and without
  the copy the preview serves 404. A real build output wins a name collision.
- **Assets over `assetLimit`** become their own file under `assets/` instead of a data URL. At
  4 kB, the same threshold Vite uses. Everything inlined means a 2 MB image costs a third more
  in the bundle and cannot be cached apart from the code.

## Building without installing

`build({ cdn: { url: 'https://esm.sh' } })` turns a bare import that nothing in the VFS resolves
into a URL the browser fetches at runtime, pinned to the range in `package.json`.

It is a **fallback, not a mode**: the resolver is still asked first, so anything installed is
still bundled, a missing relative import is still an error, and a Node builtin is still an empty
module. That is what lets it compose with a real install — a first preview can render off the
CDN while `install()` is still running, and the next build uses what landed in the VFS.

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
