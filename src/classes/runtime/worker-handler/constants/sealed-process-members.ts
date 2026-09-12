/**
 * A worker thread is a V8 isolate, so the heap and the env of the host are already out of
 * reach. `process` is not: it is the real one, and `process.binding('fs')` and
 * `process.binding('spawn_sync')` hand back native modules. These are the way out, and
 * `Function('return this')().process` reaches them from any sandbox that shares a realm.
 *
 * The list is surgical rather than wholesale: Node's own internals use `nextTick`,
 * `emitWarning` and `hrtime`, and taking those would break the worker instead of sealing it.
 */
export const SEALED_PROCESS_MEMBERS = [
  'binding',
  '_linkedBinding',
  'dlopen',
  'kill',
  'abort',
  'reallyExit',
  'exit',
  'chdir',
  'umask',
  'report',
  'setUncaughtExceptionCaptureCallback',
  '_debugProcess',
  '_debugEnd',
  '_rawDebug',
  '_startProfilerIdleNotifier',
];
