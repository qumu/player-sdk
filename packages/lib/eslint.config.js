import { defineConfig } from 'eslint/config';
import { typescript } from '@enghouse-qumu/eslint-config';

export default defineConfig([
  {
    extends: [typescript],
    files: ['**/*.ts'],
    rules: {
      // Disabled all rules forcing the use of `any` as this is a generic library and it is not possible to know the types of the inputs
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      'no-console': 'off',
    }
  }
]);
