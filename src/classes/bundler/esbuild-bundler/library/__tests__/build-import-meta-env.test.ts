import { describe, expect, it } from 'vitest';
import { buildImportMetaEnv } from '@/classes/bundler/esbuild-bundler/library/index.js';

describe('buildImportMetaEnv', () => {
  it('carries the flags Vite sets', () => {
    expect(buildImportMetaEnv('production')).toEqual({
      MODE: 'production',
      DEV: false,
      PROD: true,
      BASE_URL: '/',
      SSR: false,
    });
  });

  it('development flips DEV and PROD', () => {
    expect(buildImportMetaEnv('development')).toMatchObject({ DEV: true, PROD: false });
  });

  it('merges the caller variables in', () => {
    expect(buildImportMetaEnv('production', { VITE_API: 'https://x.dev' })).toMatchObject(
      {
        VITE_API: 'https://x.dev',
        MODE: 'production',
      },
    );
  });

  it('a caller variable can override a default', () => {
    expect(buildImportMetaEnv('production', { BASE_URL: '/app/' }).BASE_URL).toBe(
      '/app/',
    );
  });
});
