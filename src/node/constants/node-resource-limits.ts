/** A config that allocates without bound takes the worker down, not the API serving it. */
export const NODE_RESOURCE_LIMITS = { maxOldGenerationSizeMb: 512, stackSizeMb: 4 };
