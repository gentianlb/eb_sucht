import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@speech': resolve(__dirname, 'src/speech-disabled.ts'),
    },
  },
  define: {
    __DICTATION_ENABLED__: false,
  },
  build: {
    outDir: 'dist-offline',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
