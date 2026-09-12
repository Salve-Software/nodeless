import type { WorkerCommand } from './worker-command.js';

/** A command with the id that pairs it with its response. */
export type WorkerRequest = WorkerCommand & { id: number };
