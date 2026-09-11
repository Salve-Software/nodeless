# Code structure

## A class is a folder

Every class gets its own folder, inside a category folder under `classes/`.

```
classes/resolver/node-resolver/
├── index.ts                  ← exports only what is public
├── node-resolver.class.ts    ← the class
├── library/                  ← the class's functions
├── types/                    ← the class's types
└── constants/                ← the class's constants
```

`library/`, `types/` and `constants/` are optional. When they exist: **one file per thing** plus
an `index.ts` re-exporting. One type per file, always — a file holding several types is never
correct here.

## File names

| File     | Pattern            | Example                           |
| -------- | ------------------ | --------------------------------- |
| Class    | `<kebab>.class.ts` | `esbuild-bundler.class.ts`        |
| Library  | `<kebab>.ts`       | `library/load-as-file.ts`         |
| Type     | `<kebab>.ts`       | `types/resolve-scope.ts`          |
| Constant | `<kebab>.ts`       | `constants/resolve-extensions.ts` |

The `.class.ts` suffix belongs to classes only. Everything else is a plain name.

## A class file holds the class, and nothing else

**No loose `function`, no `type` declared in the class file.** Functions go to `library/` — where
they earn their own file and test — or become private methods. Types go to `types/`.

Allowed as module-private functions: table dispatch, error construction, and string plumbing.
**The documented exception is `resolve-specifier.ts`**: the `browser` field override calls
`resolveSpecifier` back, and a separate file would create a circular import inside `library/`.
It is marked with a comment in place.

## At most 2 parameters

A function, method or constructor with more than 2 parameters takes **an object**. Enforced by
`max-params`.

```ts
loadAsFile(scope, path);
resolveInPackage(scope, { packageDir, manifest, subpath });
new EsbuildBundler({ vfs, resolver, wasmURL });
```

The first parameter of every resolver function is always the `ResolveScope`, and the second is
what varies. Swapping two `string` arguments compiles and breaks at runtime; with a named
object, it does not compile.

## Order inside a class

```
fields → constructor → public methods → private methods
```

Enforced by `@typescript-eslint/member-ordering`. A private method that grows is a `library/`
function in disguise.

## Language

**All code is in English** — variable, function, constant and parameter names. So is **every
string the code emits**, including error messages and resolution reasons.

```ts
throw new ResolveError(`Cannot resolve "${specifier}" from ${importer}`, { specifier });
```

The reason is direct: those strings reach the library user's logs and anything that machine-reads
the `BuildResult`.

**Comments, test descriptions and documentation are in English too.** There is no
Portuguese anywhere in this repository.

## Types

- No `I` or `T` prefix. It is `ResolveResult`, never `IResolveResult`.
- **`src/types/` holds only what is global.** Global means the package entry contract, plus a
  port shared by more than one module — `Vfs`, `Bundler`, `Resolver`, `Installer` — **and the
  types that make up that port's signature**. `FileStat` and `RmOptions` are named by one module only, and still belong there,
  because they are part of `Vfs`: moving them down would force `types/vfs.ts` to import from
  `classes/`.
- **Everything else lives with its owner.** `PackageManifest` and `BareSpecifier` are under the
  resolver, `EsbuildBundlerOptions` and `VfsPluginOptions` under the bundler, `MemoryVfsOptions`
  under the VFS. Nothing else reads them.
- **The facade's types stay in `src/types/`.** `NodelessProjectOptions`, `WatchOptions` and
  `EsbuildApi` are the package's entry contract — the most global thing there is — and
  `NodelessProject` is a bare file with no folder to hold them.
- **`src/types/` never imports from `src/classes/`.** Contracts do not depend on
  implementations. That rule is what decides the two lists above whenever they are ambiguous.
- **`src/types/` is not automatically public.** It holds the contracts the modules share with
  each other; `src/index.ts` picks which of them ship. `Resolver`, `ResolveRequest` and
  `ResolveResult` live there and stay internal.
- The `types/` barrel re-exports with `export type *`, never `export *` — `export *` emits a
  runtime re-export even for a type-only module.
- A result with more than one shape is a **discriminated union**, not an optional flag.
  `ResolveResult` discriminates on `kind`; `BuildResult` on `ok`.

## The root of `src/`

```
src/
├── index.ts                    ← the public surface
├── nodeless-project.class.ts   ← the facade, the only loose class
├── types/                      ← the global contracts, one type per file
├── constants/  errors/  library/
└── classes/
    └── vfs/  resolver/  bundler/
```

A class folder **never** sits loose in `classes/` — always inside a category. Two exceptions,
both justified: `errors/` holds trivial one-line classes directly in the category folder, and
**`NodelessProject` is a bare file at the root of `src/`**, because it is the surface of the
package and not a member of any category. It does not get a folder.

## Imports

`@/*` points at `./src/*` and `@example/*` at `./example/*`. **Upward relative paths are
forbidden** — `../` is a lint error. `./` within the same directory is still right for
`./library/`, `./constants/` and `./types/`.

```ts
import type { ResolveScope } from '@/classes/resolver/node-resolver/types/index.js';
import { loadAsFile } from './load-as-file.js';
```

`import type` always at the top, in a separate declaration, with no inline `type` specifier.

**Node builtins are forbidden in `src/`**, by lint and by `tsconfig.build.json`. Allowed only in
`__tests__/`, `example/` and config files.
