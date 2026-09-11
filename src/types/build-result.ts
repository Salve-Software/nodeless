import type { BuildFailure } from './build-failure.js';
import type { BuildSuccess } from './build-success.js';

/** A failing build **returns** the error; it never throws. Consumers check `ok`. */
export type BuildResult = BuildSuccess | BuildFailure;
