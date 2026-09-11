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

A transform runs over the file **before** esbuild parses it, CSS modules included. What it gets
and why is in the section below.

## Transforms

Vite does not know about Tailwind either. The project declares `@tailwindcss/vite` and Vite
**executes that plugin**. Every toolchain arrives that way: Sass, MDX, SVGR, Vue.

This library cannot execute project code, so that path is closed by construction. What is left
is a table. A `SourceTransform` is three things:

```ts
interface SourceTransform {
  name: string;
  matches(file: { path: string; content: string }): boolean;
  apply(file: TransformInput): Promise<TransformResult>;
}
```

`apply` gets the file, the whole VFS and a `resolve` rooted at that file. The VFS is there
because a scanner needs the sources; `resolve` is there because a transform also has to find its
own entry, and without it each one would reimplement node resolution.

Two ship today, and they are the same shape. **Tailwind is not a special case**, it is a row:

| Transform  | Claims                                 | Peer          |
| ---------- | -------------------------------------- | ------------- |
| `tailwind` | a stylesheet using Tailwind directives | `tailwindcss` |
| `sass`     | `.scss` and `.sass`                    | `sass`        |

`transforms` in the options is tried before them, so a caller can claim a file first.

### What it costs to add one

Nothing, for anyone not using it. Each compiler is an **optional peer**, imported only once a
file is found to need it. A project with plain CSS loads neither.

The bar for shipping one is that the compiler is pure JavaScript with a callback API a VFS can
answer. Both of these are: `compile(css, { loadStylesheet })` and
`compileString(source, { importers })` never touch a filesystem. Anything needing a native
binary or the project's own config file does not qualify, and stays a caller's `transforms`
entry.

### Where the line is

The engine comes from the **host** peer, our dependency at our trust level. The files come from
the **VFS**. Running the project's own copy of Tailwind would be running project code, which is
the one thing this library does not do. The same reasoning refuses Tailwind's `@plugin` and
`@config`: they point at JavaScript.

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
