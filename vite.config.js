import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    host: '127.0.0.1',
    strictPort: true
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0
  }
});
