/**
 * A config is shallow; a plugin holding a whole compiler instance is not. Past this the
 * value is not worth crossing the channel, and saying so beats hanging on a cycle.
 */
export const MAX_SERIALIZE_DEPTH = 12;
