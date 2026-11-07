import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/education-track-system/',
  build: {
    outDir: 'docs',
  },
  plugins: [react()],
});
