import { defineConfig } from 'eslint/config';
import { astro, typescript } from '@enghouse-qumu/eslint-config';

export default defineConfig([
  {
    extends: [typescript],
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  {
    ignores: [
      '**/coverage/**/*',
      '**/dist/**/*'
    ],
  }
]);
