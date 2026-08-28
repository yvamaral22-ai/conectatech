import { defineConfig } from "vite";
import { cpSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const copyStaticFiles = {
  name: "copy-static-files",
  closeBundle() {
    cpSync("docs", "dist/docs", { recursive: true });
    copyFileSync("service-worker.js", "dist/service-worker.js");
  },
};

export default defineConfig({
  plugins: [copyStaticFiles],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        perfil: resolve(import.meta.dirname, "perfil.html"),
        trilhas: resolve(import.meta.dirname, "trilhas.html"),
        carreira: resolve(import.meta.dirname, "carreira.html"),
        oportunidades: resolve(import.meta.dirname, "oportunidades.html"),
        impacto: resolve(import.meta.dirname, "impacto.html"),
        aula: resolve(import.meta.dirname, "aula.html"),
        admin: resolve(import.meta.dirname, "admin.html"),
        curriculo: resolve(import.meta.dirname, "curriculo.html"),
        portfolio: resolve(import.meta.dirname, "portfolio.html"),
      },
    },
  },
  server: { host: "127.0.0.1", port: 4173 },
  preview: { host: "127.0.0.1", port: 4173 },
});
