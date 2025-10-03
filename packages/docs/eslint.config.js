import { defineConfig } from 'eslint/config';
import { astro, javascript, markdown } from '@enghouse-qumu/eslint-config';

export default defineConfig([
  {
    extends: [javascript],
    files: ['**/*.js'],
  },
  {
    files: ['**/code/**/*.js'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    extends: [astro],
    files: ['**/*.astro'],
  },
  {
    extends: [markdown],
    files: ['**/*.md'],
  },
]);
