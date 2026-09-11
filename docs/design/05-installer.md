# Installer — phase 2

It does not exist yet. The contract is already in `src/types/`, `install()` throws
`InstallerNotConfiguredError` with a message saying what to do, and the injection point is
`createProject({ installer })`. Today `node_modules` arrives ready-made in `files` — that is
what `example/read-project-files.ts` does.

This document is the plan, not a description of something that runs.

## The contract

```ts
interface Installer {
  install(): Promise<InstallResult>;
}

interface InstallResult {
  installed: Record<string, string>; // name → the version that landed in the VFS
  warnings: string[]; // unsatisfied peerDependencies
  lockfile: Lockfile;
}
```

## The algorithm

1. Read `dependencies` from the VFS's `/package.json`.
2. For each package, `GET https://registry.npmjs.org/<name>` — the packument — and pick the
   version with `semver.maxSatisfying`.
3. Download `dist.tarball`, unpack it with `fflate` (gunzip + untar, pure JS) and write it to
   `/node_modules/<name>/`, stripping the `package/` prefix every npm tarball carries.
4. Recurse into each installed package's `dependencies`.
5. **Flat/hoisted** layout, like npm: a single `/node_modules`; a version conflict nests under
   `/node_modules/<a>/node_modules/<b>`. The resolver already understands that layout — there is
   a test.
6. `peerDependencies` only produce warnings. They are **never** installed.
7. Cache by `name@version`, in memory. Persistence is an open decision (below).
8. Emit `/nodeless-lock.json` holding `{ name: { version, resolved, integrity } }`.

## What will not happen

**No script runs.** No `postinstall`, `prepare`, `install`, no binaries. Installing is
downloading and unpacking, and that restriction is what makes the whole sandbox unnecessary. A
package that needs a script to work is out of scope — see
[06](06-scope-and-limits.md).

## CORS

The npm registry and the CDNs (jsDelivr, unpkg) answer with CORS, so the installer works
straight from the browser. The registry URL stays configurable, for anyone behind an internal
proxy or Verdaccio.

## An alternative, if tarballs get in the way

Resolve bare imports through `https://esm.sh/<pkg>@<ver>` inside `onResolve` itself, with no
tarball at all — esm.sh already serves the package with its transitive deps resolved. It trades
disk and install time for a dependency on an external service at build time. An option, not the
default.

## Open decisions

- **Persistent cache**: IndexedDB in the browser and disk in the API, or memory only. It
  **cannot** sit behind the `Vfs` interface, which is synchronous — it belongs here, which is
  already async.
- **Freeze the scaffold's `node_modules`** (no `install()` at runtime) or let the user and the
  AI add dependencies. If it is the latter, `install()` stops being optional.
