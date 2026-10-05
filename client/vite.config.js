import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: resolve(projectRoot, 'src'),
  envDir: resolve(projectRoot, '..'),
  plugins: [react()],
  publicDir: resolve(projectRoot, 'public'),
  server: {
    proxy: {
      '/api': { target: 'http://127.0.0.1:4000', changeOrigin: true },
      '/socket.io': { target: 'http://127.0.0.1:4000', changeOrigin: true, ws: true },
    },
  },
  build: {
    outDir: resolve(projectRoot, 'dist'),
    emptyOutDir: true
  }
});