import { describe, expect, it } from 'vitest';
import { extname } from '@/library/index.js';

describe('extname', () => {
  it('takes the last extension', () => {
    expect(extname('/src/app.module.css')).toBe('.css');
  });

  it('a file without an extension gives an empty string', () => {
    expect(extname('/LICENSE')).toBe('');
  });

  // A leading dot is a file name, not an extension — hence the `> 0` in the code.
  it('a dotfile has no extension', () => {
    expect(extname('/.env')).toBe('');
  });

  it('a dot in a parent directory does not leak into the file', () => {
    expect(extname('/node_modules/.vite/dep')).toBe('');
  });
});
