import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: /^@mfui\/client$/,
        replacement: fileURLToPath(
          new URL('../../../packages/client/src/index.ts', import.meta.url),
        ),
      },
      {
        find: /^@mfui\/protocol$/,
        replacement: fileURLToPath(
          new URL('../../../packages/protocol/src/index.ts', import.meta.url),
        ),
      },
    ],
  },
  server: {
    port: 5180,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:5181',
    },
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
});
