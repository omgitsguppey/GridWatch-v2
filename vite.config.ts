import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      css: {
        postcss: './postcss.config.js',
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [],
      optimizeDeps: {
        include: ['@emotion/styled'],
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      }
    };
});
