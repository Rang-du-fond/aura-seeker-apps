import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// The API has no CORS headers: serve it under /api on the app's own origin.
const apiProxy = {
  "/api": {
    target: process.env.API_URL ?? "http://127.0.0.1:8080",
    rewrite: (path: string) => path.replace(/^\/api/, ""),
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
})
