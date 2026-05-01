import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve("./src"),
    },
  },

  // ── Build optimizations for production ──
  build: {
    // Target modern browsers for smaller, faster JS output
    target: "es2020",

    // Enable minification with terser for smaller bundles
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,   // Strip console.log in production
        drop_debugger: true,  // Strip debugger statements
      },
    },

    // Manual chunk splitting — separates vendor libs from app code.
    // Browser caches vendor chunks long-term since they rarely change.
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — cached separately, rarely changes
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Charting lib — only needed on dashboard/admin pages
          "vendor-charts": ["recharts"],
          // UI utilities — shared across most components
          "vendor-ui": ["lucide-react", "clsx", "tailwind-merge", "class-variance-authority"],
        },
      },
    },

    // Increase chunk size warning limit (recharts is large)
    chunkSizeWarningLimit: 600,

    // Generate source maps for production debugging (optional)
    sourcemap: false,
  },

  // ── Dev server settings ──
  server: {
    port: 5173,
    strictPort: true,
  },
});
