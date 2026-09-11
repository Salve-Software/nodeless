import { describe, expect, it } from 'vitest';
import { loaderFor } from '@/classes/bundler/esbuild-bundler/library/index.js';

describe('loaderFor', () => {
  it('picks the loader from the extension', () => {
    expect(loaderFor('/src/App.tsx')).toBe('tsx');
    expect(loaderFor('/src/x.ts')).toBe('ts');
    expect(loaderFor('/src/app.css')).toBe('css');
    expect(loaderFor('/package.json')).toBe('json');
  });

  // Plenty of libraries ship JSX inside `.js`; the `jsx` loader reads plain JS too.
  it('js comes in as jsx', () => {
    expect(loaderFor('/node_modules/p/index.js')).toBe('jsx');
  });

  it('an asset becomes a data URL', () => {
    expect(loaderFor('/src/logo.svg')).toBe('dataurl');
    expect(loaderFor('/src/photo.png')).toBe('dataurl');
  });

  // An unknown extension must never become executable code.
  it('an unknown extension falls back to text', () => {
    expect(loaderFor('/LICENSE')).toBe('text');
    expect(loaderFor('/src/data.yaml')).toBe('text');
  });
});
