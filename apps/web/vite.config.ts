import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";

const directory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "widget-dev-entry",
      configureServer(server) {
        server.middlewares.use((request, _response, next) => {
          const url = request.url ?? "";
          if (url === "/widget.js" || url.startsWith("/widget.js?")) {
            request.url = "/src/widget.tsx";
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(directory, "src"),
    },
  },
  server: {
    port: 5173,
    cors: true,
    origin: "http://localhost:5173",
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  build: {
    rollupOptions: {
      input: path.resolve(directory, "src/widget.tsx"),
      output: { entryFileNames: "widget.js" },
    },
  },
});
