import fs from 'node:fs';
import { defineConfig } from 'vite';

const packageJson = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8')
);

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version || 'dev'),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
