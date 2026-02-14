import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // SPA fallback — serve index.html for all routes (e.g. /auth/callback)
  // so the OAuth redirect doesn't 404 in preview/production mode.
  appType: "spa",
})
