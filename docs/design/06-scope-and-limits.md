# Scope and limits

## What the library does

**Pure-JS dependencies** — React, ReactDOM, UI libraries like Radix and shadcn, utilities — with
TS, TSX, JS, JSX, plain CSS, JSON and assets as data URLs.

## What it does not do, and why

| Does not do                                      | Why                                                       |
| ------------------------------------------------ | --------------------------------------------------------- |
| emulate Node (`fs`, `net`, `child_process`)      | **it is not a WebContainer**; nothing in the project runs |
| run `package.json` scripts and `postinstall`     | executing is exactly what the library avoids              |
| dependencies with native bindings (`.node`)      | they need a process with dlopen — there is none here      |
| Rolldown, lightningcss, `sharp`, embedded `sass` | all of them depend on a native binary                     |
| Tailwind v4                                      | depends on lightningcss                                   |
| CSS modules and React Refresh                    | not implemented yet — phase 4                             |

**None of this is a matter of time.** The first three rows follow directly from the premise: if
the library executed code, it would need isolation, and isolation is precisely the cost it
exists to remove.

Tailwind v3 through PostCSS in pure JS fits the scope and is queued for phase 4.

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
| 6   | The scaffold builds in under 500 ms warm in Node                         | ✅ ~200 ms |
| 7   | Zero dependency on `child_process`, a real `fs`, or an external binary   | ✅         |

\* The `dist/` is verifiably Node-free — only two bare imports, both resolvable through an
import map — and `example/browser` runs that same file in the browser. Byte-for-byte
equivalence between the two sides is not covered by an automated test yet; today it is checked
by hand.

## References

- **almostnode** (`macaly/almostnode`, MIT) — `src/npm/` has a working installer and
  `src/virtual-fs.ts` a VFS. It is browser-only and emulates all of Node; useful for lifting
  installer pieces, not as a dependency.
- **esbuild-plugin-velcro** — an esbuild plugin that resolves deps without `npm install`.
- **Sandpack** (`codesandbox/sandpack`) — in-browser bundling in production for years; a good
  source of resolution edge cases.
- **`@rollup/browser`** — an alternative bundler if esbuild-wasm ever stops fitting.
