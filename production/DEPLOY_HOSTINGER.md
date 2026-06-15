# Deploying Roni's Production Floor to Hostinger

The app is a **static single-page app** (Vite build). Hostinger shared hosting
serves static files from `public_html`, so deploying = uploading the built files.
There's no server to run and no env vars to set on Hostinger — the Supabase URL +
anon key are already baked into the build (they're public, protected by RLS).

## What you upload
The contents of the `production/dist/` folder (I send you this as a zip):
- `index.html`
- `assets/` (hashed JS/CSS)
- `.htaccess` (routing + caching — **make sure this hidden file is included**)

## Steps (hPanel File Manager — no terminal needed)
1. Log in to Hostinger → **Websites** → your domain → **File Manager** (hPanel).
2. Open **`public_html`**. If deploying to the site root, clear out the default
   placeholder files there first (e.g. an existing `index.html` from Hostinger).
3. **Upload** every file from the zip into `public_html`, keeping the structure:
   `public_html/index.html`, `public_html/assets/...`, `public_html/.htaccess`.
   - If the upload skips `.htaccess` (hidden files), enable "show hidden files" in
     File Manager settings, or create it manually and paste the contents.
4. Visit your domain. You should see the "Who's on the floor?" sign-in screen.

## Verify it's live and persisting
- Sign in with a PIN (e.g. **Marco / 1234**), or admin via **0712**.
- Start and complete a production, choose where it goes.
- **Refresh** — your data should still be there.
- Open the site on a **second device/browser** — it should show the same data.
  That proves Supabase persistence is working end to end.

## Subfolder deploys (only if NOT at the domain root)
If you serve the app from a subpath like `yourdomain.com/floor/`, the asset paths
need a base. Tell me the subpath and I'll rebuild with `base: '/floor/'` — then
re-upload. At a domain/subdomain root, no change is needed.

## Redeploying later (after code changes)
Re-run `npm run build` (or I do it), then upload the new `dist/` contents,
replacing the old ones. The `.htaccess` tells browsers not to cache `index.html`,
so updates show up immediately; the hashed assets are safe to long-cache.

## Custom domain / SSL
Use Hostinger's built-in **SSL** (free) for the domain so the app is served over
HTTPS — Supabase requires HTTPS in production browsers.
