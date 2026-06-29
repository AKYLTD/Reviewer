import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Stamp the app.js reference with a per-build version (?v=...) so browsers always
// fetch the newest file after a deploy — no manual cache clearing needed, even
// though the filename stays stable (easy one-file overwrite on the host).
const cacheBust = () => ({
  name: "cache-bust",
  transformIndexHtml(html) {
    const v = Date.now().toString(36);
    return html.replace('src="/app.js"', `src="/app.js?v=${v}"`);
  },
});

// Vite + React. Builds to a static `dist/` bundle that can be hosted anywhere
// (Hostinger public_html / static host). Supabase will provide DB + auth later.
export default defineConfig({
  plugins: [react(), cacheBust()],
  // The prototype uses inline styles only — no Tailwind/PostCSS. Pin an empty
  // PostCSS config so Vite doesn't walk up and load the parent repo's config.
  css: { postcss: {} },
  build: {
    // Flat, stable filenames (no content hash, no assets/ subfolder) so a
    // re-deploy is just "overwrite app.js" — no folder juggling on the host.
    rollupOptions: {
      output: {
        entryFileNames: "app.js",
        chunkFileNames: "app-[name].js",
        assetFileNames: "[name][extname]",
      },
    },
  },
});
