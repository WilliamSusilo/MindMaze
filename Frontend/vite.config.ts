import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  server: {
    proxy: {
      "/game": {
        target: process.env.VITE_API_BASE_URL || "https://mindmaze-roan.vercel.app",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
