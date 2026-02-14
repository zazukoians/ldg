import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  root: 'app',
  base: './',
  define: {
    __LOGGING__: true,
    __PROXY__: false,
    __PROXY_URL__: JSON.stringify(''),
    __SESSION_STORAGE__: true,
    __SHOW_ENDPOINT__: true,
    __VERSION__: JSON.stringify(packageJson.version),
  },
  server: {
    open: true,
    port: 5173,
  },
  resolve: {
    extensions: ['.js', '.json'],
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'esnext',
    minify: 'terser',
  },
});
