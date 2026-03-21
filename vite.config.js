import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ["personal-blog-v1-e2bt.onrender.com"],
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
