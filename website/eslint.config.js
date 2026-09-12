import js from '@eslint/js';
import { config, configs } from 'typescript-eslint';

// The site is an app, not the library: it has no isomorphism guard and no class folders.
// What it keeps is the type safety and the import hygiene.
export default config(
  { ignores: ['dist'] },
  js.configs.recommended,
  ...configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  { files: ['**/*.js'], ...configs.disableTypeChecked },
);
