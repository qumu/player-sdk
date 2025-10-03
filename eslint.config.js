import { defineConfig } from 'eslint/config';
import { typescript } from '@enghouse-qumu/eslint-config';

export default defineConfig([
  {
    files: ['packages/lib/**/*.ts'],
    extends: [typescript],
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
