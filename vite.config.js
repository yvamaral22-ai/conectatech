import { defineConfig } from 'vite';
import { cpSync, copyFileSync } from 'node:fs';

const copyStaticFiles = {
  name: 'copy-static-files',
  closeBundle() {
    cpSync('docs', 'dist/docs', { recursive: true });
    copyFileSync('service-worker.js', 'dist/service-worker.js');
  },
};

export default defineConfig({
  plugins: [copyStaticFiles],
  server: { host: '127.0.0.1', port: 4173 },
  preview: { host: '127.0.0.1', port: 4173 },
});
