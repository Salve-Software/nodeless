import { TAILWIND_MARKERS } from '@/classes/css-transform/tailwind-transform/constants/index.js';

export function isTailwindStylesheet(css: string): boolean {
  return TAILWIND_MARKERS.test(css);
}
