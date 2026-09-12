/**
 * Tailwind's own scanner is a native binary. Everything that could be a utility is fed in
 * instead, and Tailwind drops whatever it does not recognise.
 */
export const CANDIDATE_PATTERN = /[^\s"'`<>{}()=;,]+/g;
