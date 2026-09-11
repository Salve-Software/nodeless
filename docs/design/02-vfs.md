# VFS

A `Map<string, Uint8Array>` keyed by absolute POSIX paths, plus a `Set` of explicit
directories. User sources and `node_modules` live in the **same** VFS — the resolver cannot
tell them apart, and that is what makes Node resolution work with no adaptation.

## Every path goes through `normalizePath`

Once it enters the API it becomes absolute POSIX: `src/main.tsx`, `/src/./main.tsx` and
`//src/main.tsx` are the same file. No relative path is ever stored anywhere, and `..` never
escapes the root.

## Why it is synchronous

`Vfs.readFile` is synchronous because esbuild's `onResolve` is called thousands of times per
build and the content is already in memory — there is nothing to wait for. An async VFS would
infect the whole resolver with `await` and buy nothing.

The consequence matters: **a persistent cache cannot sit behind the `Vfs` interface.**
IndexedDB in the browser and disk in Node are both async, so they belong in the installer,
which is async by nature. The VFS stays pure memory.

## A directory really exists

A VFS that infers directories from file prefixes cannot represent an empty folder, and
`readdir` on a freshly created one would lie. Hence the `Set<string>` of directories: `mkdir`
registers the path and every ancestor, `writeFile` registers the parent.

## Snapshot

A snapshot is plain JSON — `{ version, files: { path: base64 }, directories: [] }` — because it
crosses the network between API and front end. Base64 because `JSON.stringify` on a
`Uint8Array` produces an index-keyed object several times larger.

`version` is checked on the way in: a snapshot of an unknown version is **rejected**, not read
halfway. Changing the format means bumping `SNAPSHOT_VERSION`.

`MemoryVfs` accepts `snapshot` and `files` together, in that order: the snapshot is the base and
`files` is the patch on top. That is the case of recreating a session and immediately applying
the user's latest edit.

## `watch`

The VFS emits `{ path, type: 'write' | 'remove' }` to anyone listening, and `NodelessProject`
layers the debounce on top — typing must not become one build per keystroke.

What closes the loop is a bundler rule: **`build()` does not write to the VFS.** The result
comes back in memory. If it wrote to `/dist`, every build would fire the watcher, which would
fire another build.
