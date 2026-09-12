# Architecture

Six modules, each with a contract in `src/types/` and an implementation in `src/classes/`.

```
types/  ← contracts: Vfs, Resolver, Bundler, Installer, Runtime, Plugin
   ↑
classes/vfs/ · resolver/ · bundler/ · installer/ · runtime/ · shims/ · plugin/ · config/
   ↑
nodeless-project.class.ts  ← the facade that stitches them together
```

| Module      | What it does                                                       |
| ----------- | ------------------------------------------------------------------ |
| `vfs`       | in-memory filesystem; sources and `node_modules` in the same place |
| `resolver`  | Node's resolution algorithm, over the VFS                          |
| `bundler`   | esbuild-wasm plus the plugin that binds esbuild to the VFS         |
| `installer` | npm without npm: packument, semver, tarball, hoisting, lockfile    |
| `shims`     | Node's standard library, implemented against the VFS               |
| `runtime`   | evaluates a module out of the VFS, with builtins already rewritten |
| `plugin`    | the Rollup and Vite hook protocol                                  |
| `config`    | finds the project's config file and runs it through the runtime    |

## The rule that holds everything up

**There are two graphs and they get different treatment.**

- The **bundle graph** — rooted at the entry, containing the application and its dependencies —
  is read as text and never executed. This has not changed and will not.
- The **config graph** — rooted at `vite.config.ts`, containing the toolchain — **is executed**,
  because a build tool that does not run is a build tool you have to reimplement.

They are disjoint by construction: the entry is never reachable from the config.

## The sandbox is the emulation

`ModuleRuntime` bundles a module before evaluating it, and every `node:fs` in that bundle is
resolved **by our own resolver, at bundle time**, to a shim over the VFS. When the code finally
runs, the real builtin is not blocked — it was never in the bundle.

The consequence: there is no disk to escape to, because the only filesystem that exists is a
`Map`. What is left is `eval` and an `import()` with a computed specifier, which is documented
risk and not an open door. `createRequire` refuses anything but a builtin for the same reason:
answering a dynamic require with an empty module would fail later and somewhere else.

## Isomorphism is a contract, not an intention

`src/` does not import Node builtins. Not `node:fs`, not `path`, not `process`. Two things
enforce it:

- `tsconfig.build.json` with `types: []` — without Node's types, `node:fs` does not compile;
- ESLint's `no-restricted-imports`, relaxed only in `__tests__/` and `example/`.

`new Function` is the default evaluator for the same reason: a `Worker` is browser-only and a
`data:` URL import is blocked by CSP in a browser. It is the least isolated of the three, and
that is acceptable **because isolation was decided at bundle time**.

**`process` and `require` are shadowed as parameters of the evaluated function**, so a bare
reference inside a config resolves to the shim and not the host's. Without that, `process.env`
in a config is the environment of whatever is running the build — on a server, your secrets.
`globalThis` is not shadowable, and closing that is what the second mode is for.

`WorkerRuntime` is the hardened one, behind the same port. It bundles identically and evaluates
in a Worker, which costs a channel: structured clone carries no functions, so a plugin crosses
as data with every hook replaced by a handle. Only VFS deltas cross, and every call flushes
them first — a hook reading `this.vfs` has to see the file the user just edited.

## A build error is data; a config error is an exception

`build()` returns `BuildResult`, a union discriminated on `ok`. Syntax errors, unresolved
imports and a missing entry all come out in `errors: BuildMessage[]` with file, line and column.

A config that throws is different: it is misuse of the toolchain, not an outcome of the build,
and it comes out as `RuntimeError` naming the module with the original error as its `cause`.
`FileNotFoundError`, `InvalidSnapshotError` and `InstallError` are the same category.
`ResolveError` is thrown by the resolver and converted by the bundler plugin into a
`BuildMessage`.

## Maintenance rules

- **Every VFS path is POSIX and absolute.** Once it comes in, it has been through
  `normalizePath`. No relative path is ever stored. **The shims are the exception by design**:
  `node:path` implements Node's semantics, where a relative path stays relative and
  `dirname('a.ts')` is `.`. That is why `posix-*` exists next to `src/library/`'s helpers.
- **A new Node builtin goes in `NodeShims`, not in a special case elsewhere.** That is the
  whole bet. If a toolchain fails for want of `node:zlib`, the fix is one shim, once.
- **A builtin that implies a process imports fine and throws when called.** A dead code path
  reaching for `child_process` must not take a build down.
- **The resolver does not watch the VFS.** It caches `package.json` per directory, which is why
  `invalidate()` is called at the start of every `build()`.
- **A package with `exports` is sealed.** An unmapped subpath does not exist and does **not**
  fall back to `main`.
- **Conditions differ between the graphs.** `DEFAULT_CONDITIONS` puts `browser` first, because
  the bundle targets a browser. `RUNTIME_CONDITIONS` puts `node` first, because a plugin's
  `browser` entry is a stub meant for the app it builds, not for itself.
- **Built-in plugins run last.** `tailwindPlugin` and `sassPlugin` are `enforce: 'post'` so that
  a config bringing `@tailwindcss/vite` leaves them nothing to claim.
- **The config is resolved once per mode.** A watch rebuild reuses the plugin instances; editing
  the config file invalidates it, which is why Vite restarts on one.
- **The bundler is built on the first build, not in the constructor.** The resolver needs the
  config's aliases, and reading a config means running one, which cannot happen synchronously.
- **Public surface**: `NodelessProject` is the only class exported, plus `tailwindPlugin` and
  `sassPlugin` as functions. Types ship when they are part of the contract.
- **`src/index.ts` never uses `export *`.** Every name is listed.
- **A package installs, it never runs.** No `postinstall`, no `prepare`. Installing is
  downloading and unpacking; the toolchain runs at build time, from what was unpacked.
- **`src/node/` is Node-only and nothing in `src/` may import it.** It is the server half of
  `isolation: 'worker'`, built by `tsconfig.node.json` with `types: ["node"]` and excluded from
  the isomorphism guard. The dependency only ever points inward.
- **The worker entry is published bundled.** A blob Worker inherits no import map, so
  `dist/runtime-worker.js` must have zero bare imports; `build:worker` fails the build if one
  survives. It is the one file in `dist/` that is not plain `tsc` output.
- **Runtime dependencies are expensive.** There are four: `esbuild-wasm`, `resolve.exports`,
  `semver` and `fflate`. Each has to work in the browser with no shim.
