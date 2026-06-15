import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite + React. Builds to a static `dist/` bundle that can be hosted anywhere
// (Hostinger public_html / static host). Supabase will provide DB + auth later.
export default defineConfig({
  plugins: [react()],
  // The prototype uses inline styles only — no Tailwind/PostCSS. Pin an empty
  // PostCSS config so Vite doesn't walk up and load the parent repo's config.
  css: { postcss: {} },
});
