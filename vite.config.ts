import { defineConfig } from 'vitest/config';
export default defineConfig({
  base: './',
  build: { rollupOptions: { output: { manualChunks: id => id.includes('/node_modules/phaser/') ? 'phaser' : undefined } } },
  test: { include: ['src/tests/**/*.test.ts'] },
});
