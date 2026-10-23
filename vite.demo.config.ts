import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false,

  build: {
    outDir: path.resolve(import.meta.dirname, 'demo'),
    emptyOutDir: false,
    target: 'es2019',
    lib: {
      entry: path.resolve(import.meta.dirname, 'frontend/src/DemoApi/index.ts'),
      formats: ['iife'],
      name: 'SonarrDemoApi',
      fileName: () => 'demo-api.js',
    },
  },
});
