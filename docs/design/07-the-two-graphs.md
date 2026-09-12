# The two graphs

## The question this answers

Can this library build _any_ frontend project, or only the ones someone has written a transform
for?

The first architecture answered "only the ones someone has written a transform for", and it did
not look like it was answering that at the time. It looked like a clean seam: `SourceTransform`,
a `matches` and an `apply`, Tailwind and Sass implementing it. But the Tailwind transform had to
reimplement Tailwind's candidate scanner with a regex, because the real one is a Rust binary,
and it had to throw on `@plugin` and `@config`, because those point at JavaScript. Vue, Svelte,
MDX and svgr would each have cost another folder with the same shape and the same compromises.

That is not a flaw in the seam. It is what the founding rule required.

## The rule that caused it

> Nothing from the user's project is ever executed.

Every frontend toolchain defines its behaviour **in JavaScript**. `vite.config.ts` is a module.
A Vite plugin is an object with functions on it. `tailwind.config.js` is a module. Refusing to
execute any of it means reimplementing all of it, declaratively, one tool at a time, forever.

The rule conflated two things that are not the same:

|                      | Application code | Toolchain code                           |
| -------------------- | ---------------- | ---------------------------------------- |
| Example              | `src/App.tsx`    | `vite.config.ts`, `@vitejs/plugin-react` |
| Runs during a build? | never            | that is its entire purpose               |
| Reached from         | the entry point  | the config file                          |

## They are disjoint by construction

This is the part that makes the split mechanical rather than a judgement call:

```
/vite.config.ts                      ┐
/node_modules/@vitejs/plugin-react/  ├─ the config graph
/node_modules/@tailwindcss/vite/     ┘

/index.html                          ┐
/src/main.tsx                        │
/src/App.tsx                         ├─ the bundle graph
/node_modules/react/                 ┘
```

`App.tsx` is never imported by `vite.config.ts`. `react` is never imported by `vite.config.ts` —
it is imported by `App.tsx`, which is the other graph. Nothing has to decide which category a
module belongs to; the import edges already did.

So: the config graph is executed, the bundle graph is read as text. Rule 1 survives, narrowed to
what it always meant.

## Why this scales and the old shape did not

It is an argument about cardinality.

| Commit to supporting…  | Size of the set         | Grows?       |
| ---------------------- | ----------------------- | ------------ |
| the plugin ecosystem   | infinite                | every week   |
| Node's builtin modules | closed, ~12 that matter | not in years |

The claim is **not** that the shims are little work. `node:fs` alone is `readFileSync`,
`promises`, `Stats`, `Dirent`, `realpath`, file descriptors; there is a long tail of
`x.y is not a function` from real packages. The claim is that the long tail **converges**,
because the set it is drawn from is closed, while the plugin tail diverges.

Sandpack and WebContainer both made this bet. It is a known cost, not a research project.

## Where the isolation comes from

Not from a guard, and not from a Worker. From the resolver.

`ModuleRuntime` bundles the config graph **before** evaluating it, through the same
`NodeResolver` and `esbuild-wasm` the app graph uses. Every `node:fs` in that bundle is resolved
at bundle time to a shim over the VFS. By the time anything runs, the real builtin is not
blocked — it is not in the bundle.

```
import fs from 'node:fs'   ──resolved at bundle time──▶   the shim over the VFS
```

The consequence is stronger than a sandbox that allows and denies: there is no disk to escape
to, because the only filesystem that exists is a `Map` in memory. `existsSync('/etc/passwd')` is
`false` not because it was refused but because it is not there.

**What is left.** `eval`, `new Function`, and `import()` with a computed specifier cannot be
resolved statically and are the remaining surface. This is documented risk, not an open door;
`createRequire` refuses anything but a builtin for the same reason, because answering a dynamic
require with an empty module would fail later and somewhere else.

`new Function` is the **default** evaluator because it is the only one that exists on both
sides: a `Worker` is browser-only and a `data:` URL import is blocked by CSP in a browser.

It is also the least isolated of the three, and that is only half acceptable. The builtins are
unreachable, but the page's globals are not: a hostile `vite.config.ts` still sees `document`,
`localStorage` and `fetch`. In a playground the config is code somebody else typed, so that
gap is real.

`isolation: 'worker'` closes it. Same bundling, same shim rewriting, evaluated in a Worker
instead — no DOM, no `localStorage`, no cookies, and `fetch`, `indexedDB` and `caches` deleted
before the first line runs. The cost is a channel, and the channel is the interesting part:

- **Structured clone carries no functions**, and a plugin is mostly functions. Each one crosses
  as a handle the other side turns back into a call. This is why Rollup's `this.resolve` is
  async in the first place.
- **The worker needs a filesystem**, so it gets a snapshot and then only deltas. A full
  snapshot per build would cost more than the build.
- **Every call flushes those deltas first.** A hook reading `this.vfs` runs long after the
  module was evaluated, and has to see the file the user just edited.

The default stays in-process because that half is the isomorphic one, and because a project
with no config file evaluates nothing at all — there is nothing to isolate.

## Being compatible with Vite, not being Vite

Running `vite build` itself would need `worker_threads`, an HTTP server and native rollup. That
is a Node emulation project, and a different product.

Running the **plugin protocol** is most of the value and a fraction of the cost. A Vite plugin
is an object with `name`, `resolveId`, `load`, `transform` and `configResolved`; it takes strings
and returns strings. The hook set is not arbitrary — it is the minimal complete set ten years of
bundler evolution converged on, which is exactly why adopting it wholesale is what makes a
plugin from npm cost nothing here.

## What it still cannot do

- **Native binaries without a WASM build.** `lightningcss`, `@swc/core`, `sharp`. The fix for
  the ones that have a WASM equivalent is a table mapping package to package — data, not code.
  That is a much smaller and more bounded kind of work than reimplementing behaviour, which is
  the whole point of the move, but it is not nothing.
- **Output hooks.** `generateBundle`, `renderChunk`, `this.emitFile`. esbuild's plugin API has
  `onResolve` and `onLoad` and no output phase at all. Input hooks map cleanly and output hooks
  have nowhere to go. If this becomes the binding constraint, it is the argument for
  `@rollup/wasm-node` as the driver instead of esbuild — a slower but semantically complete one.
- **Sourcemaps through a transform.** `onLoad` takes no input sourcemap, so a `.vue` or `.scss`
  file cannot map back to its source. The protocol accepts `map` and the edge drops it, which is
  more honest than pretending to thread it.
- **A moving target.** Vite's plugin API changes across majors. Smaller than a folder per tool,
  larger than zero.
- **A hardened runtime on a server.** `isolation: 'worker'` needs a browser `Worker`. On Node
  the seam exists — `runtime` takes any implementation of the port, and `RuntimeChannel` is
  what a `worker_threads` adapter would implement — but nothing ships for it yet.
