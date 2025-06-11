import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 3000
  },
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      '@shared/schema': path.resolve(__dirname, '../shared/schema.ts'),
      '@shared': path.resolve(__dirname, '../shared'),
      '@': path.resolve(__dirname, './src'),
      // Other aliases can still be handled by vite-tsconfig-paths
    },
  },
});
