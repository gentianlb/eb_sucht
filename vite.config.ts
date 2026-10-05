import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/eb_sucht/',
  resolve: {
    alias: {
      '@speech': resolve(__dirname, 'src/speech.ts'),
    },
  },
  define: {
    __DICTATION_ENABLED__: true,
  },
});
