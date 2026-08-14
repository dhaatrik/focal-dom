import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'content/content-script': 'src/content/content-script.ts',
    'background/service-worker': 'src/background/service-worker.ts',
    'popup/popup': 'src/popup/popup.ts',
    'index': 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: false,
  clean: false,
  sourcemap: true,
});
