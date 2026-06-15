/* Supabase client — created from Vite env vars (set in .env.local locally and in
   the host's env at deploy time). The anon key is public and protected by RLS.
   If env is missing (e.g. a bare build with no env), `supabase` is null and the
   data layer degrades gracefully instead of throwing. */
import { createClient } from "@supabase/supabase-js";

// Browser (Vite) reads import.meta.env; Node scripts read process.env — so the
// same db.js layer works in the app and in one-off scripts.
const env = (k) =>
  (typeof import.meta !== "undefined" && import.meta.env?.[k]) ||
  (typeof process !== "undefined" && process.env?.[k]) ||
  undefined;
const url = env("VITE_SUPABASE_URL");
const key = env("VITE_SUPABASE_ANON_KEY");

export const supabase = url && key ? createClient(url, key) : null;
export const hasSupabase = !!supabase;

if (!supabase && typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.warn("Supabase env vars missing — running without persistence.");
}
