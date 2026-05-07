import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures paths work correctly on GitHub Pages
  build: {
    outDir: 'dist',
  }
});
