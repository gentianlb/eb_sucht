import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/eb_sucht/',
  resolve: {
    alias: {
      '@dictation-panel': resolve(import.meta.dirname, 'src/DictationPanel.tsx'),
      '@speech': resolve(import.meta.dirname, 'src/speech.ts'),
    },
  },
});
