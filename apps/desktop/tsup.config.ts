import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'main/main': 'src/main/main.ts',
    'preload/preload': 'src/preload/preload.ts',
    'index': 'src/index.ts',
  },
  format: ['cjs'],
  dts: false,
  clean: false,
  sourcemap: true,
  external: ['electron', 'ws', 'adm-zip'],
});
