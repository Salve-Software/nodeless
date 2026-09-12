import {
  DIST_MARKER,
  WORKER_ENTRY_NAME,
} from '@/classes/runtime/worker-runtime/constants/index.js';

/**
 * The worker entry sits at the root of the package, and this file sits under `classes/`, so
 * cutting at the marker gives the root without a relative path the lint rules forbid.
 */
export function defaultWorkerUrl(): string {
  const here = import.meta.url;
  const marker = here.indexOf(DIST_MARKER);

  if (marker === -1) {
    throw new Error(
      `Cannot locate ${WORKER_ENTRY_NAME} from ${here}. Pass \`workerUrl\` pointing at the built worker entry.`,
    );
  }

  return `${here.slice(0, marker)}/${WORKER_ENTRY_NAME}`;
}
