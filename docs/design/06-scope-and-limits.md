# Scope and limits

## What the library does

**Pure-JS dependencies** — React, ReactDOM, UI libraries like Radix and shadcn, utilities — with
TS, TSX, JS, JSX, plain CSS, CSS modules, Sass, Tailwind, JSON and assets.

**And the project's own toolchain.** A `vite.config.ts` is executed and its plugins run, so a
framework nodeless has never heard of costs no code here. See
[`07-the-two-graphs.md`](07-the-two-graphs.md) for why that does not break the premise.

## What it does not do, and why

| Does not do                                      | Why                                                       |
| ------------------------------------------------ | --------------------------------------------------------- |
| emulate Node (`fs`, `net`, `child_process`)      | **it is not a WebContainer**; nothing in the project runs |
| run `package.json` scripts and `postinstall`     | executing is exactly what the library avoids              |
| dependencies with native bindings (`.node`)      | they need a process with dlopen — there is none here      |
| Rolldown, lightningcss, `sharp`, embedded `sass` | all of them depend on a native binary                     |
| React Refresh                                    | deliberate, see below                                     |

**None of this is a matter of time.** The first three rows follow directly from the premise: if
the library executed code, it would need isolation, and isolation is precisely the cost it
exists to remove.

**Tailwind v4 works two ways now.** The built-in plugin calls `compile(css, { loadStylesheet })`
— pure JavaScript, reading through a callback a VFS can answer — and feeds it candidates scraped
out of the VFS, because Tailwind's own scanner is a native binary. That path refuses `@plugin`
and `@config`.

The other way is to put `@tailwindcss/vite` in the project's config, which goes through the
runtime and can run those. Which of the two is available depends on whether the integration
pulls in a native dependency, and that is now a property of the package rather than of nodeless.

**React Refresh is a decision, not a gap.** It needs a Babel-grade transform — `react-refresh`
ships a Babel plugin, and esbuild does not do that kind of AST work. What it buys is preserved
component state across an edit. A full rebuild plus an iframe reload costs ~200 ms, which is
already below the threshold where anyone notices, so the machinery would be paying a large
complexity bill for a small comfort. If state preservation ever becomes the point, this is where
it would be revisited.

## The boundary

The library produces an artifact. What executes is the iframe, in the user's browser, with the
isolation the browser already provides. The day something has to run during the build — a
plugin, a `postinstall`, a `config.js` — the premise has broken and it is a different
conversation.

## Acceptance criteria

| #   | Criterion                                                                | State      |
| --- | ------------------------------------------------------------------------ | ---------- |
| 1   | `createProject({ files })` + `build()` in Node produces a dist that runs | ✅         |
| 2   | The same code runs in the browser and produces the same dist             | ✅\*       |
| 3   | `install()` builds `node_modules` from `package.json`                    | phase 2    |
| 4   | Syntax and import errors come back structured, with nothing thrown       | ✅         |
| 5   | No user code is ever executed                                            | ✅         |
| 6   | The scaffold builds fast enough to replace a dev server                  | ✅ ~200 ms |
| 7   | Zero dependency on `child_process`, a real `fs`, or an external binary   | ✅         |

Criterion 2 is proved by `npm run example:browser:test`, a CI job: a headless Chromium opens the
playground, installs from registry.npmjs.org over CORS, builds, and the iframe **executes** the
result — React mounts, state updates on click, an edit rebuilds. Byte-for-byte equivalence
between the two sides is still not asserted; what is asserted is that both sides work.

Criterion 3 is proved end to end by `npm run example:install`, which runs in CI: react,
react-dom, @radix-ui/react-dialog, lucide-react, zustand, react-router, date-fns, zod and clsx
come off registry.npmjs.org — 36 packages — and the result bundles.

## References

- **almostnode** (`macaly/almostnode`, MIT) — `src/npm/` has a working installer and
  `src/virtual-fs.ts` a VFS. It is browser-only and emulates all of Node; useful for lifting
  installer pieces, not as a dependency.
- **esbuild-plugin-velcro** — an esbuild plugin that resolves deps without `npm install`.
- **Sandpack** (`codesandbox/sandpack`) — in-browser bundling in production for years; a good
  source of resolution edge cases.
- **`@rollup/browser`** — an alternative bundler if esbuild-wasm ever stops fitting.
