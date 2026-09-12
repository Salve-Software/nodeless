/**
 * A response id no request ever has. The worker channel uses it to say it died, which is the
 * only failure that cannot be paired with the call that caused it.
 */
export const FATAL_RESPONSE_ID = -1;
