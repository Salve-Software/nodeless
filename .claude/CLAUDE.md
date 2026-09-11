# nodeless

An isomorphic JS library that installs npm dependencies and produces the `dist/` of a frontend
project **in-process**: no VM, no container, no shell, no child process. The same code runs on a
Node API and in the browser.

```ts
const project = new NodelessProject({ files }); // { 'src/main.tsx': '…', 'vite.config.ts': '…' }
await project.install(); // registry → .tgz → VFS
const result = await project.build(); // runs the project's config, then bundles
project.watch(() => project.build().then(render)); // the "npm run dev"
new NodelessProject({ snapshot: project.snapshot() }); // the same state, other side of the wire
```

## The insight

A frontend project has **two module graphs**, and they are disjoint by construction:

| Graph      | Rooted at        | What it contains                              | Treatment               |
| ---------- | ---------------- | --------------------------------------------- | ----------------------- |
| **config** | `vite.config.ts` | the toolchain: plugins, compilers, transforms | **executed**            |
| **bundle** | `src/main.tsx`   | the application and its dependencies          | read as text, never run |

`App.tsx` is never imported by `vite.config.ts`. `react` is never imported by
`vite.config.ts` — it is imported by `App.tsx`, which is the other graph.

Bundling the second graph needs no VM: resolving an `import` and transpiling TSX do not execute
anything. Running the first graph does need one — and the VM it needs is not a container. It is
a module resolver pointed at shimmed builtins, which is a library and not a machine.

## Why this is the shape that scales

| You commit to supporting… | Size of the set             | Grows?       |
| ------------------------- | --------------------------- | ------------ |
| the plugin ecosystem      | **infinite**                | every week   |
| Node's builtin modules    | **closed, ~12 that matter** | not in years |

The old architecture bet on the first set, and it showed: `TailwindTransform` reimplemented
Tailwind's scanner with a regex because the real one is a Rust binary, and `@plugin` threw
because it points at JavaScript. Vue, Svelte and MDX would each have cost another folder.

Betting on the second set means the work **converges** instead of diverging. It is not less
work up front; it is work that ends. This is the bet Sandpack and WebContainer both made.

## The four rules that are not up for negotiation

1. **The project's application code is never executed.** Not during `install()`, not during
   `build()`. The bundle graph is text in and text out. The **config graph** is executed, in a
   sandbox, because that is what a toolchain is for — and it is a different graph.
2. **The sandbox is the emulation, not a guard.** Every `node:fs` in the config graph is
   rewritten to a shim **at bundle time, by our own resolver**, before a line runs. The real
   builtin is unreachable rather than reachable and blocked. There is no disk to escape to.
3. **The package is genuinely isomorphic.** One codebase, zero Node builtins in `src/`. What
   enforces it is `tsconfig.build.json` with `types: []` — it breaks the build if anyone slips.
4. **A failing build returns a structured error; it does not throw.** `{ ok: false, errors }`
   with file and line. `build()` also never writes to the VFS — if it did, `watch` would fire
   itself.

## State

Six modules, all green. `npm run example` builds the React scaffold offline in ~200 ms warm;
`npm run example:install` pulls 36 packages off registry.npmjs.org; `npm run example:vite` runs
a project's own `vite.config.ts` — a plugin that reads `node:fs` and gets the VFS, a virtual
module, a `define` and an alias, none of which nodeless has any code for.

`npm run playground` installs from the registry **in the browser** and rebuilds as you type, and
a headless Chromium run of it is a CI job.

**What is still missing**, and each is a decision rather than a gap:

- **Native binaries.** `lightningcss`, `@swc/core`, `sharp`. The fix is a shim table mapping a
  package to its WASM equivalent, which is data; the ones with no WASM build stay out.
- **Output hooks.** `generateBundle` and `renderChunk` have nowhere to live: esbuild's plugin
  API has no output phase. A manifest or compression plugin will not work. This is the
  mismatch that could eventually argue for `@rollup/wasm-node` as the driver.
- **Sourcemaps through a transform.** A plugin may return `map` and it is dropped, because
  esbuild's `onLoad` has no input-sourcemap channel.
- **Running real `vite build`.** Out of scope: it wants `worker_threads`, a server, and native
  rollup. Being _compatible with_ Vite plugins is what buys the coverage.
- **React Refresh.** Still a deliberate no — a rebuild plus an iframe reload costs ~200 ms.

## Mandatory rules

@rules/architecture.md
@rules/code-structure.md
@rules/comments.md
@rules/testing.md
@rules/tooling.md
