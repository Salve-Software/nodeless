# nodeless design

This is where the **why** lives. What the library does is in the
[README](../../README.md); how to write code in it is in
[`.claude/rules/`](../../.claude/rules/).

| Document                                        | About                                                         |
| ----------------------------------------------- | ------------------------------------------------------------- |
| [01 — The idea](01-the-idea.md)                 | why a React build needs neither Node nor a VM                 |
| [02 — VFS](02-vfs.md)                           | in-memory filesystem, snapshots, and why it is synchronous    |
| [03 — Resolver](03-resolver.md)                 | the hard part: `exports`, the `browser` field, subpaths       |
| [04 — Bundler](04-bundler.md)                   | esbuild-wasm with no filesystem, and the plugin that binds it |
| [05 — Installer](05-installer.md)               | npm without npm: the phase 2 plan                             |
| [06 — Scope and limits](06-scope-and-limits.md) | what the library does not do, and why                         |
