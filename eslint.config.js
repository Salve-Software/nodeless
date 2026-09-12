import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { flatConfigs as importX } from 'eslint-plugin-import-x';
import { config, configs } from 'typescript-eslint';

export default config(
  {
    // The example projects are input to the library, not part of it: they are built
    // by nodeless rather than compiled by tsc, so they are outside every tsconfig.
    ignores: [
      'dist',
      'node_modules',
      'example/app',
      'example/browser',
      'example/install',
      'example/tailwind',
      'example/vite',
      'example/node/dist',
    ],
  },

  js.configs.recommended,
  ...configs.recommendedTypeChecked,
  importX.recommended,
  importX.typescript,

  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({ alwaysTryTypes: true }),
      ],
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/consistent-type-exports': [
        'error',
        { fixMixedExportsWithInlineTypeSpecifier: false },
      ],

      'import-x/order': [
        'error',
        {
          groups: [
            ['type'],
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-duplicates': ['error', { 'prefer-inline': false }],
      'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^\\.\\./',
              message:
                'Use the @/ alias instead of an upward relative path. Only ./ within the same directory is allowed.',
            },
          ],
        },
      ],

      // The package is isomorphic: no Node builtins outside tests and examples.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['node:*', 'fs', 'path', 'child_process', 'worker_threads'],
              message:
                'The package is isomorphic. No Node builtins in src/ — only in __tests__/ and example/.',
            },
          ],
        },
      ],

      '@typescript-eslint/require-await': 'off',

      'max-params': ['error', 2],

      '@typescript-eslint/member-ordering': [
        'error',
        {
          default: {
            memberTypes: [
              'signature',
              'field',
              'constructor',
              'public-method',
              'protected-method',
              'private-method',
              '#private-method',
            ],
          },
        },
      ],

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  {
    // `src/node/` is the deliberate exception to the isomorphism rule: it is the Node-only
    // entry point, built by its own tsconfig, and `worker_threads` is the whole reason it
    // exists. Nothing in `src/` may import from it.
    files: ['src/node/**/*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },

  {
    // The shims mirror Node's own signatures. `Buffer.toString(encoding, start, end)` is
    // three parameters because that is what the toolchain calls.
    files: ['src/classes/shims/**/*.ts'],
    rules: { 'max-params': 'off' },
  },

  {
    files: [
      'src/**/__tests__/**/*.ts',
      'example/**/*.ts',
      'scripts/**/*.ts',
      '*.config.ts',
    ],
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'no-console': 'off',
    },
  },

  {
    files: ['**/*.js'],
    ...configs.disableTypeChecked,
  },

  prettier,
);
