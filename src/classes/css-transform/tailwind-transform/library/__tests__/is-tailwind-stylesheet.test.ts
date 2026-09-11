import { describe, expect, it } from 'vitest';
import { isTailwindStylesheet } from '@/classes/css-transform/tailwind-transform/library/index.js';

describe('isTailwindStylesheet', () => {
  it('recognises the v4 entry import', () => {
    expect(isTailwindStylesheet("@import 'tailwindcss';")).toBe(true);
    expect(isTailwindStylesheet('@import "tailwindcss";')).toBe(true);
  });

  it('recognises the v3 directives', () => {
    expect(isTailwindStylesheet('@tailwind base;')).toBe(true);
  });

  it('recognises a file that only uses a directive', () => {
    expect(isTailwindStylesheet('.a { @apply flex; }')).toBe(true);
    expect(isTailwindStylesheet('@theme { --color-a: red; }')).toBe(true);
    expect(isTailwindStylesheet('@utility tab { tab-size: 4; }')).toBe(true);
  });

  // Loading the engine for a stylesheet that never needed it would be waste on every build.
  it('plain css is not Tailwind', () => {
    expect(isTailwindStylesheet('body { color: red; }')).toBe(false);
    expect(isTailwindStylesheet('@media (min-width: 40rem) { .a { color: red; } }')).toBe(
      false,
    );
    expect(isTailwindStylesheet("@import './theme.css';")).toBe(false);
  });
});
