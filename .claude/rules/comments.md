# Comments

**As lean as possible.** One line or nothing.

## JSDoc — allowed, short

One line on a class, method, function or type. It says what **that** thing is, or why it exists.

**Never inside an interface body.** A member comment breaks the shape you are trying to read —
the whole point of an interface is that it fits in one glance. If a field needs explaining, the
explanation belongs in the interface's own one-line JSDoc, or in the README when it is a
default or an option list. If it fits in neither, the field name is wrong.

```ts
/** `snapshot` is applied first and `files` on top of it, so a snapshot can act as the base. */
export interface MemoryVfsOptions {
  files?: FileInput;
  snapshot?: VfsSnapshot;
}
```

```ts
/** esbuild-wasm over the VFS. Bundling is text transformation — nothing in the project runs. */
export class EsbuildBundler {}
```

**Paragraph blocks are forbidden.** If it does not fit on one line, what is left over is
decision context — it goes to `docs/design/`, the README or a commit message, not into the file.

The test: if the text stays true when pasted onto another thing of the same kind, it says
nothing. `"Resolves the specifier"` fits any resolver function; `"A package with exports is
sealed: what is not mapped does not exist, and never falls back to main"` fits this one.

A good name needs no JSDoc. `loadAsFile`, `nodeModulesDirs` and `collectDirEntries` have none,
and are not missing anything.

## Comments inside a method

**Would deleting this make someone break the code?** If not, delete it. Four kinds get through:

| Kind                           | Example in this repository                                                    |
| ------------------------------ | ----------------------------------------------------------------------------- |
| Looks like a bug and is not    | `extname` using `> 0` instead of `>= 0`, because `.env` is a name, not an ext |
| Deliberate absence             | `dispose()` not stopping esbuild, because the WASM instance is process-wide   |
| Invisible trap                 | `String.fromCharCode(...bytes)` blowing the stack past ~100k arguments        |
| Compatibility with the outside | rewriting `./x.js` to `./x.ts`, because that is what TypeScript ESM mandates  |

Not allowed: narrating the next block, repeating the function name, explaining the pattern
instead of the instance.

## A comment carrying third-party behaviour

A rule that came from Node, esbuild or a real package **says where it came from**.

```ts
// In an ESM project TypeScript tells you to import `./x.js` for a file named `./x.ts`.
// `initialize` throws if it is called twice on the same instance.
```

## Exception

`TODO(phase N):` marking work that already has a contract and no implementation. Today there is
exactly one such path, the installer, and it does not use `TODO`: it throws
`InstallerNotConfiguredError` with a message saying what to do. **An explicit error beats a
silent `TODO`.**

When in doubt, do not comment.
