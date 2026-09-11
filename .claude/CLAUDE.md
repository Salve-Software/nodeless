# nodeless

An isomorphic JS library that installs npm dependencies and produces the `dist/` of a React
project **without Node**: no shell, no disk, no child process, no VM. The same code runs on a
Node API and in the browser.

```ts
const project = new NodelessProject({ files }); // { 'src/main.tsx': '…', 'package.json': '…' }
await project.install(); // registry → .tgz → VFS, nothing executed
const result = await project.build(); // { 'index.html', 'bundle.js', 'bundle.css' }
project.watch(() => project.build().then(render)); // the "npm run dev"
new NodelessProject({ snapshot: project.snapshot() }); // the same state, other side of the wire
```

## The insight

A React build is: read files → resolve every `import` down to `node_modules` → transpile TSX →
concatenate → emit JS and CSS. **None of that executes the project's code.** What executes is
the iframe, in the user's browser. The VM that runs `npm run build` today is there to isolate
something that is already harmless.

Three jobs that looked like one:

| Job                             | Needs a VM?                        |
| ------------------------------- | ---------------------------------- |
| agent workspace                 | no — a VFS does it                 |
| `npm install` + `npm run build` | no — an in-process bundler does it |
| isolating the generated code    | no — bundling does not execute     |

`npm run dev` is not needed either: preview is build plus iframe, and the scaffold builds in
~200 ms.

## The four rules that are not up for negotiation

1. **Nothing from the user's project is ever executed.** Not during `install()`, not during
   `build()`. No `postinstall`, no `package.json` scripts, no CLIs, no `eval`.
2. **The package is genuinely isomorphic.** One codebase, zero Node builtins in `src/`. What
   enforces it is `tsconfig.build.json` with `types: []` — it breaks the build if anyone slips.
3. **A failing build returns a structured error; it does not throw.** `{ ok: false, errors }`
   with file and line — enough for the caller to locate the failure and act on it.
4. **`build()` does not write to the VFS.** If it did, `watch` would fire itself.

## State

All four modules are implemented and green. `npm run example` builds the React scaffold offline
in ~200 ms warm; `npm run example:install` pulls 36 packages off registry.npmjs.org — Radix,
lucide, zustand, react-router, date-fns, zod — and bundles them, and both run in CI.

CSS modules work, Tailwind v3 works through the `cssTransform` seam, and `build({ cdn })` can
resolve uninstalled packages off a CDN. All four extra examples run in CI.

**What is still missing:** React Refresh, which is a deliberate no — a rebuild plus an iframe
reload costs ~200 ms and the transform it needs is Babel-grade work esbuild does not do.
Persistent caching is a `PackageCache` away and has no implementation. The browser page exists
and the `dist/` is verifiably Node-free, but nobody has run it in an actual browser yet.

## Mandatory rules

@rules/architecture.md
@rules/code-structure.md
@rules/comments.md
@rules/testing.md
@rules/tooling.md
