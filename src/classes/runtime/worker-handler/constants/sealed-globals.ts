/**
 * Deleted from the worker before anything runs. A Worker already has no DOM and no
 * `localStorage`; these are what is left that reaches outside, and a build does not need them.
 */
export const SEALED_GLOBALS = [
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'indexedDB',
  'caches',
  'importScripts',
  'navigator',
  'BroadcastChannel',
];
