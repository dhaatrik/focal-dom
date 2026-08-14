import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@focaldom/core': resolve(__dirname, 'packages/core/src/index.ts'),
      '@focaldom/capture-playwright': resolve(__dirname, 'packages/capture-playwright/src/index.ts'),
      '@focaldom/renderer': resolve(__dirname, 'packages/renderer/src/index.ts'),
      '@focaldom/studio': resolve(__dirname, 'packages/studio/src/index.ts'),
      '@focaldom/extension': resolve(__dirname, 'packages/extension/src/index.ts'),
    },
  },
  test: {
    include: [
      'packages/**/tests/**/*.test.ts',
      'apps/**/tests/**/*.test.ts',
    ],
  },
});
