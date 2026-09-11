# Installer

`npm install` without npm, and without executing anything. Reads `/package.json` from the VFS,
talks to the registry over `fetch`, and fills `/node_modules` — the same code in Node and in the
browser.

```ts
const project = new NodelessProject({ files });
const { installed, warnings, lockfile } = await project.install();
```

## The walk

Breadth first, one round trip per level:

```
read /package.json → dependencies
│
└─ for each level, in parallel:
   ├─ fetchPackument   GET <registry>/<name>, abbreviated document
   ├─ pickVersion      semver.maxSatisfying, or a dist-tag
   ├─ downloadPackage  cache → tarball → integrity → gunzip → untar
   │
   └─ then, synchronously:
      ├─ planInstallDir  root, or nested under the dependent
      ├─ writePackage    into the VFS
      └─ queue the transitive dependencies
```

**Placement is synchronous on purpose.** Fetching runs in parallel, but deciding where a package
goes does not — otherwise two dependents could both claim the root `node_modules` for different
versions of the same package, and whichever wrote last would win at random.

## devDependencies are opt-in

A Vite project keeps `tailwindcss` and `@tailwindcss/vite` in `devDependencies`, because there
they are build tooling rather than runtime dependencies. Installing only `dependencies` leaves
the CSS with nothing to resolve. `install({ dev: true })` brings them in.

It stays off by default because most of what lives there — eslint, vitest, typescript — is never
imported by the code being built, and downloading it into a browser VFS is pure waste.

## Workspaces

A package listed under `workspaces` lives in the repository, so asking the registry for it gets
a 404. It is copied out of the VFS instead, and its own dependencies are walked like any other
package. Its `node_modules` is left behind, since copying that would duplicate the tree.

## One bad package does not sink the rest

An unresolvable package used to abort the whole install, so a single private dependency cost you
every other one. It becomes a `warnings` entry now, the same as an unsatisfied peer, and the
build decides whether it was ever needed. A type-only import disappears in the bundle and never
misses it.

## Hoisting

Flat, like npm: everything lands in `/node_modules`. When a second dependent asks for a version
the root copy does not satisfy, that copy nests under its own dependent:

```
/node_modules/dep                         2.0.0   ← claimed first
/node_modules/legacy/node_modules/dep     1.5.0   ← nested, because ^1.0.0 conflicts
```

That is exactly the layout the resolver already walks, so nothing special is needed to read it
back.

A package whose root copy **does** satisfy the range is skipped entirely — not just re-used, but
not walked again. That is also what breaks dependency cycles.

## Nothing is executed

No `postinstall`, no `prepare`, no binaries, no lifecycle script of any kind. Installing is
downloading and unpacking. That restriction is what makes the whole sandbox unnecessary — see
[06](06-scope-and-limits.md).

## Tarballs

An npm tarball is gzip over TAR. `fflate` does the gzip half; the TAR half is written here,
because the format is small and pulling in a tar library would mean pulling in one that assumes
Node streams.

`untar` handles the ustar `prefix` field and the pax `path` record, which is what node-tar emits
for any path over 100 bytes. Directory and link entries are dropped. `stripRootDir` removes the
`package/` root that npm always adds.

## Integrity

`dist.integrity` from the packument is verified with `crypto.subtle` before the bytes are
unpacked. **A missing integrity is tolerated; a wrong one is not** — old registry entries may
carry none, but a mismatch means the bytes are not what the registry published.

## Caching

`PackageCache` is keyed by `name@version` and holds the extracted files, so a hit skips the
network, the gunzip and the untar all at once. The default lives in memory for the process.

The port is **async on purpose**: IndexedDB in the browser and disk in Node are both async, and
the `Vfs` port is synchronous so it could never hold them.

Within a single run, two more maps stop duplicate work: one packument fetch per package and one
download per `name@version`, no matter how many dependents ask at the same time.

## Peer dependencies

Reported, never installed. A peer the package marks optional in `peerDependenciesMeta` is not
even reported — every Radix package marks `@types/react` optional, and warning about it would
bury the peers that actually matter.

## The lockfile

`/nodeless-lock.json`, keyed by **install directory** rather than by name, because a nested copy
is a different entry:

```json
{
  "lockfileVersion": 1,
  "packages": {
    "node_modules/dep": { "version": "2.0.0", "resolved": "…", "integrity": "sha512-…" },
    "node_modules/legacy/node_modules/dep": { "version": "1.5.0", "resolved": "…" }
  }
}
```

Entries are sorted by directory, so the file is stable across runs.

## What is not supported

Only registry ranges. `npm:`, `file:`, `git+https:` and friends are refused with a clear error
rather than guessed at — supporting them would mean supporting something other than the
registry.

Only `dependencies`. `devDependencies` never reach a browser bundle.

## Open decision

Persistent caching is a port with no implementation yet. IndexedDB in the browser and disk on
the API are both a `PackageCache` away, and neither needs a change here.
