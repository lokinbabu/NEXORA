import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the frontend proxies /api to the Express server,
// so the browser sees a same-origin API (cookies work seamlessly).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // Override with VITE_PROXY_TARGET if port 5000 is busy on your machine.
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
