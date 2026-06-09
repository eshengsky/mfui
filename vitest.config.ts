import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = new URL('.', import.meta.url);

function fromRoot(path: string): string {
  return fileURLToPath(new URL(path, root));
}

export default defineConfig({
  resolve: {
    alias: {
      '@mfui/protocol': fromRoot('packages/protocol/src/index.ts'),
      '@mfui/client': fromRoot('packages/client/src/index.ts'),
      '@mfui/client/definitions': fromRoot(
        'packages/client/src/definitions/index.ts',
      ),
      '@mfui/client/layouts': fromRoot(
        'packages/client/src/layouts/index.ts',
      ),
      '@mfui/server': fromRoot('packages/server/src/index.ts'),
    },
  },
});
