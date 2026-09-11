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

  // `local-css` scopes the class names and hands back a map of original to hashed.
  it('a .module.css file is a css module, not plain css', () => {
    expect(loaderFor('/src/button.module.css')).toBe('local-css');
    expect(loaderFor('/src/button.css')).toBe('css');
  });

  // `.module.css` has to be the end of the name, not just somewhere in it.
  it('a file merely containing module is still plain css', () => {
    expect(loaderFor('/src/module.css.backup.css')).toBe('css');
    expect(loaderFor('/src/my.module.css.ts')).toBe('ts');
  });

  // An unknown extension must never become executable code.
  it('an unknown extension falls back to text', () => {
    expect(loaderFor('/LICENSE')).toBe('text');
    expect(loaderFor('/src/data.yaml')).toBe('text');
  });
});
