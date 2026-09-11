/** A stylesheet is Tailwind's if it uses any of its directives. Plain CSS has none of these. */
export const TAILWIND_MARKERS =
  /@import\s+['"]tailwindcss|@tailwind\b|@apply\b|@theme\b|@source\b|@plugin\b|@config\b|@utility\b|@variant\b/;
