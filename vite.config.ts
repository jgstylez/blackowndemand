import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      input: 'index.html'
    },
    sourcemap: mode === 'development'
  },
  define: {
    __DEV__: mode === 'development',
    __PROD__: mode === 'production'
  }
}));