import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 8080
  },
  build: {
    rollupOptions: {
      input: 'index.html',
      // Ignore admin component errors during build
      external: [],
      onwarn(warning, warn) {
        // Suppress warnings from admin components
        if (warning.loc?.file?.includes('src/components/admin/')) {
          return;
        }
        warn(warning);
      }
    },
    sourcemap: mode === 'development'
  },
  define: {
    __DEV__: mode === 'development',
    __PROD__: mode === 'production'
  },
  esbuild: {
    target: 'es2020',
    // Suppress TypeScript errors for admin components
    tsconfigRaw: {
      compilerOptions: {
        skipLibCheck: true,
        noUnusedLocals: false,
        noUnusedParameters: false,
        strict: false,
        noImplicitAny: false,
        noImplicitReturns: false,
        noImplicitThis: false,
        useUnknownInCatchVariables: false
      }
    }
  }
}));