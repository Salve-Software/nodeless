/**
 * A config is code, and running it in the caller's process is a decision rather than a
 * default. Warned rather than thrown while the package is pre-1.0: the behaviour is what it
 * always was, and only the silence about it has changed.
 */
export const UNSET_ISOLATION_WARNING =
  'This config ran in the same process as the caller, because `isolation` was not set. ' +
  "Pass isolation: 'none' to say that is intended, or isolation: 'worker' to run it in a " +
  'realm of its own. This will be an error in 1.0.';
