# Architecture

Four modules, each with a contract in `src/types/` and an implementation in `src/classes/`.

```
types/  ← contracts: Vfs, Resolver, Bundler, Installer
   ↑
classes/vfs/  ·  classes/resolver/  ·  classes/bundler/  ·  classes/installer/
   ↑
nodeless-project.class.ts  ← the facade that stitches the four together
```

| Module      | What it does                                                       |
| ----------- | ------------------------------------------------------------------ |
| `vfs`       | in-memory filesystem; sources and `node_modules` in the same place |
| `resolver`  | Node's resolution algorithm, over the VFS                          |
| `bundler`   | esbuild-wasm plus the plugin that binds esbuild to the VFS         |
| `installer` | npm without npm: packument, semver, tarball, hoisting, lockfile    |

## The rule that holds everything up

**No user code is ever executed.** Installing is downloading and unpacking; building is
transforming text. There is no `eval`, no `new Function`, no dynamic import of project code, no
running of `package.json` scripts. The isolation does not come from a sandbox — it comes from
there being no execution.

Corollary: `install()` **never** runs `postinstall`, and dependencies with native bindings
(`.node`) are out of scope by construction, not for lack of time.

## Isomorphism is a contract, not an intention

`src/` does not import Node builtins. Not `node:fs`, not `path`, not `process`. Two things
enforce it:

- `tsconfig.build.json` with `types: []` — without Node's types, `node:fs` does not compile;
- ESLint's `no-restricted-imports`, relaxed only in `__tests__/` and `example/`.

Only `fetch`, `TextEncoder`/`TextDecoder`, `btoa`/`atob` and `setTimeout` — what exists on both
sides. Disk I/O, where it has to exist, lives in `example/` and in the tests.

## The VFS is synchronous, and that is a decision

`Vfs.readFile` is synchronous because esbuild's `onResolve` needs a fast answer and the resolver
runs thousands of times per build. An async VFS would infect the whole resolver with `await` and
buy nothing: the content is already in memory.

The consequence: a persistent cache (IndexedDB, disk) **cannot** sit behind the `Vfs` interface.
It belongs in the installer, which is async by nature.

## A build error is data, not an exception

`build()` returns `BuildResult`, a union discriminated on `ok`. Syntax errors, unresolved
imports and a missing entry point all come out in `errors: BuildMessage[]` with file, line and
column. A caller that has to act on a failure needs the position, and an exception would lose
it.

Exceptions are reserved for misuse and for install failures, not for build outcomes:
`FileNotFoundError`, `InvalidSnapshotError`, `InstallError`. `ResolveError` is thrown by the resolver
and caught by the plugin, which converts it into a `BuildMessage`.

## `build()` is pure with respect to the VFS

The result comes back in memory and is **not** written to `/dist`. If it were, every build would
fire `watch`, which would fire another build. Anyone who wants the dist in the VFS writes it
themselves.

## What each folder holds

| Folder                   | What it is                                              |
| ------------------------ | ------------------------------------------------------- |
| `types/`                 | the package contracts and the shapes crossing the API   |
| `constants/`             | constants used by more than one folder                  |
| `errors/`                | `NodelessError` and its subclasses                      |
| `library/`               | ownerless pure functions: POSIX paths, base64, encoding |
| `classes/vfs/`           | `MemoryVfs`                                             |
| `classes/resolver/`      | `NodeResolver` and the algorithm under `library/`       |
| `classes/bundler/`       | `EsbuildBundler` and the `nodeless-vfs` plugin          |
| `classes/installer/`     | `RegistryInstaller` and the in-memory package cache     |
| `nodeless-project.class` | the facade; the only loose class at the root            |

## Maintenance rules

- **Every VFS path is POSIX and absolute.** Once it comes in, it has been through
  `normalizePath`. No relative path is ever stored.
- **The resolver does not watch the VFS.** It caches `package.json` per directory, which is why
  `invalidate()` is called at the start of every `build()`. Installing a dependency after the
  first build has to keep working — there is a test.
- **A package with `exports` is sealed.** An unmapped subpath does not exist and does **not**
  fall back to `main`. That is how Node and esbuild behave; loosening it hides the package's bug.
- **A Node builtin becomes an empty module with a warning**, never an error. A dependency that
  imports `fs` on a dead code path must not take the user's build down.
- **A new `exports` condition** goes into `DEFAULT_CONDITIONS`, in order. `browser` comes before
  `import` because the target is the browser.
- **Public surface**: `NodelessProject` is the **only runtime export**. The class is how the
  library is used — no factory function, no second entry point, no implementation class offered
  as an alternative. Types are free to be exported when they are part of the contract; they are
  erased at build time and cost nothing.
- **`src/index.ts` never uses `export *`.** Every name is listed, so adding to the surface is a
  decision and not a side effect of dropping a file into a folder.
- **A package installs, it never runs.** No `postinstall`, no `prepare`, no lifecycle script.
  The day one has to run, the premise of the library has broken.
- **Placement during install is synchronous.** Fetching is parallel; deciding where a package
  lands is not, or two dependents race for the root `node_modules`.
- **Runtime dependencies are expensive.** There are four today: `esbuild-wasm`,
  `resolve.exports`, `semver` and `fflate`. Each one has to work in the browser with no shim.
  Before adding a fifth, ask whether you could just write it.
