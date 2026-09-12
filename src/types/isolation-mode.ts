/**
 * Where the project's config graph is evaluated. `none` is in-process and isomorphic;
 * `worker` is browser-only and keeps the toolchain away from the page.
 */
export type IsolationMode = 'none' | 'worker';
