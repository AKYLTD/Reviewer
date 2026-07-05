/* ============================================================================
   db — the persistence layer for Roni's Production Floor.

   Maps the app's in-memory shapes (camelCase, name-keyed stock) to/from the
   Supabase tables (snake_case, id-keyed stock), and exposes the reads/writes the
   App component needs. The UI keeps its exact shapes; all translation lives here.
   ============================================================================ */
import { supabase } from "./supabase.js";

/* ---------- row <-> app mappers ---------- */
export const ingFromRow = (r) => ({ id: r.id, name: r.name, unit: r.unit, cost: Number(r.cost) || 0 });
export const ingToRow = (i) => ({ id: i.id, name: i.name, unit: i.unit || "kg", cost: Number(i.cost) || 0 });

export const recFromRow = (r) => ({
  id: r.id, name: r.name, category: r.category || "", department: r.department || "",
  dept2: r.dept2 || "Production", notes: r.notes || "", allergens: r.allergens || [],
  dietary: r.dietary || [], hero: r.hero || null, images: r.images || null,
  yieldKg: Number(r.yield_kg), yieldUnit: r.yield_unit, expectedSec: r.expected_sec, steps: r.steps || [],
  asComponent: !!r.as_component,
});
export const recToRow = (r) => ({
  id: r.id, name: r.name, category: r.category || null, department: r.department || null,
  dept2: r.dept2 || "Production", notes: r.notes || "", allergens: r.allergens || [],
  dietary: r.dietary || [], hero: r.hero ?? null, images: r.images ?? null,
  yield_kg: r.yieldKg ?? 10, yield_unit: r.yieldUnit || "kg", expected_sec: r.expectedSec ?? 0, steps: r.steps || [],
  as_component: !!r.asComponent,
});

export const staffFromRow = (r) => ({ id: r.id, name: r.name, wage: Number(r.wage) || 0, role: r.role, perms: Array.isArray(r.perms) ? r.perms : (r.role === "driver" ? [] : ["production"]) });
export const staffToRow = (s) => {
  const row = { id: s.id, name: s.name, wage: Number(s.wage) || 0, role: s.role || "production", perms: Array.isArray(s.perms) ? s.perms : (s.role === "driver" ? [] : ["production"]) };
  if (s.pin) row.pin = s.pin; // pin is write-only; only set it when an actual value was entered
  return row;
};

export const locFromRow = (r) => ({ id: r.id, name: r.name, address: r.address || "", distanceMi: Number(r.distance_mi) || 0, driveMin: Number(r.drive_min) || 0 });
export const locToRow = (l) => ({ id: l.id, name: l.name, address: l.address || "", distance_mi: Number(l.distanceMi) || 0, drive_min: Number(l.driveMin) || 0 });

const runFromRow = (r) => ({ id: r.id, recipeId: r.recipe_id, recipe: r.recipe, qty: Number(r.qty), unit: r.unit, by: r.by_name, totalSec: r.total_sec, labour: Number(r.labour), ingCost: Number(r.ing_cost), deliv: Number(r.deliv), total: Number(r.total), when: r.when_label, at: r.created_at });
const cancelFromRow = (r) => ({ id: r.id, recipe: r.recipe, qty: Number(r.qty), unit: r.unit, by: r.by_name, stoppedAtStep: r.stopped_at_step, totalSteps: r.total_steps, when: r.when_label });
const alertFromRow = (r) => ({ id: r.id, kind: r.kind || "time", message: r.message || null, recipe: r.recipe, from: r.from_sec, to: r.to_sec, dir: r.dir, diff: r.diff, runs: r.runs, when: r.when_label });

/* Fast, tiny staff-only fetch so the sign-in names appear immediately, instead of
   waiting for the full loadAll() (which fetches recipes/runs/stock in parallel). */
export async function loadStaff() {
  if (!supabase) return null;
  let r = await supabase.from("staff").select("id,name,wage,role,perms").neq("role", "admin");
  if (r.error) r = await supabase.from("staff").select("id,name,wage,role").neq("role", "admin");
  if (r.error) throw r.error;
  return (r.data || []).map(staffFromRow);
}

/* ---------- initial load ---------- */
/* Recipes carry base64 images (hero + per-step photos + the images json) that can be
   tens of MB in total. Loading them up-front is what made the app slow / time out.
   We fetch a LIGHT version first (everything needed to render lists and run a
   production, minus the heavy image blobs) so the app is usable instantly, then the
   App streams the images in afterwards. Layered fallbacks keep this safe whether or
   not the optional `recipes_light` view has been created in the database. */
const RECIPE_LIGHT_COLS = "id,name,category,department,dept2,notes,allergens,dietary,yield_kg,yield_unit,expected_sec,as_component,steps";
let _lightView = "unknown"; // "unknown" | "yes" | "no" — remembered for the session
async function selRecipesLight() {
  // Best: a `recipes_light` view that strips ALL images (hero, images json AND per-step
  // photos) so the first load is a few KB regardless of how big the stored photos are.
  if (_lightView !== "no") {
    const v = await supabase.from("recipes_light").select("*");
    if (!v.error) { _lightView = "yes"; return v; }
    _lightView = "no"; // view not created yet — don't try again this session
  }
  // Good: at least skip the two heavy dedicated image columns.
  const r = await supabase.from("recipes").select(RECIPE_LIGHT_COLS);
  if (!r.error) return r;
  // Last resort: full rows.
  return await supabase.from("recipes").select("*");
}

/* Fetch the heavy image data for a handful of recipes at a time, by id. The App calls
   this in small chunks after first paint so no single request is ever huge. */
export async function loadRecipeMediaChunk(ids) {
  if (!supabase || !ids || !ids.length) return [];
  // Full image payload (hero + images json + steps with their per-step photos). The
  // light load strips these; this brings them back a few recipes at a time.
  const { data, error } = await supabase.from("recipes").select("id,hero,images,steps").in("id", ids);
  if (error) throw error;
  return data || [];
}

/* Targeted single-column update — used for things like the yield auto-adjust so we
   never rewrite a whole recipe row (which could blank its images if the media for that
   recipe hasn't streamed in yet). */
export async function updateRecipeFields(id, patch) {
  if (!supabase) return;
  const { error } = await supabase.from("recipes").update(patch).eq("id", id);
  if (error) throw error;
}

export async function loadAll() {
  if (!supabase) return null;
  const sel = (t, opts) => supabase.from(t).select("*", opts);
  // Resilient staff load: prefer the perms column, but fall back gracefully if the
  // permissions migration hasn't been run yet (so deploy order can't break sign-in).
  const staffSel = (async () => {
    let r = await supabase.from("staff").select("id,name,wage,role,perms").neq("role", "admin");
    if (r.error) r = await supabase.from("staff").select("id,name,wage,role").neq("role", "admin");
    return r;
  })();
  const [ing, rec, stf, loc, cpuR, del, runs, cancels, alerts, store, central, queue] = await Promise.all([
    sel("ingredients"),
    selRecipesLight(),
    staffSel,
    sel("locations"),
    sel("cpu"),
    sel("delivery_settings"),
    supabase.from("production_runs").select("*").order("created_at", { ascending: false }),
    supabase.from("cancellations").select("*").order("created_at", { ascending: false }),
    supabase.from("alerts").select("*").order("created_at", { ascending: false }),
    sel("store_stock"),
    sel("central_stock"),
    supabase.from("delivery_queue").select("*").order("created_at", { ascending: true }),
  ]);
  for (const r of [ing, rec, stf, loc, cpuR, del, runs, cancels, alerts, store, central, queue]) {
    if (r.error) throw r.error;
  }

  const recipes = (rec.data || []).map(recFromRow);
  const locations = (loc.data || []).map(locFromRow);
  const recName = Object.fromEntries((rec.data || []).map((r) => [r.id, r.name]));
  const locName = Object.fromEntries((loc.data || []).map((l) => [l.id, l.name]));

  const storeStock = {};
  for (const row of store.data || []) {
    const ln = locName[row.location_id], rn = recName[row.recipe_id];
    if (!ln || !rn) continue;
    (storeStock[ln] ||= {})[rn] = Number(row.qty);
  }
  const centralStock = {};
  for (const row of central.data || []) {
    const rn = recName[row.recipe_id];
    if (rn) centralStock[rn] = Number(row.qty);
  }
  const deliveryQueue = {};
  for (const row of queue.data || []) {
    const ln = locName[row.location_id];
    if (!ln) continue;
    (deliveryQueue[ln] ||= []).push({ id: row.id, recipe: row.recipe, qty: Number(row.qty), unit: row.unit, by: row.by_name, when: row.when_label });
  }

  const cpu = cpuR.data?.[0] ? { name: cpuR.data[0].name, address: cpuR.data[0].address || "", singleSite: !!cpuR.data[0].single_site } : { name: "", address: "", singleSite: false };
  const delivery = del.data?.[0] ? { perMile: Number(del.data[0].per_mile), perHour: Number(del.data[0].per_hour) } : { perMile: 0, perHour: 0 };

  return {
    ingredients: (ing.data || []).map(ingFromRow),
    recipes,
    staff: (stf.data || []).map(staffFromRow),
    locations,
    cpu,
    delivery,
    runs: (runs.data || []).map(runFromRow),
    cancellations: (cancels.data || []).map(cancelFromRow),
    alerts: (alerts.data || []).map(alertFromRow),
    storeStock,
    centralStock,
    deliveryQueue,
  };
}

/* ---------- collection writes ----------
   Upserts are debounced (called on settle with the full current list); deletes
   are explicit and run immediately for just the removed ids. Keeping them apart
   avoids losing a delete when rapid edits coalesce. */
export async function upsertRows(table, rows) {
  if (!supabase || !rows.length) return;
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { error } = await supabase.from(table).upsert(rows);
      if (!error) return;
      lastErr = error;
    } catch (e) { lastErr = e; }
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1))); // backoff before retry
  }
  throw lastErr || new Error("upsert failed");
}
export async function deleteByIds(table, ids) {
  if (!supabase || !ids.length) return;
  const { error } = await supabase.from(table).delete().in("id", ids);
  if (error) throw error;
}

/* Clear the reports log — every production run and cancellation. Stock is untouched. */
export async function resetReports() {
  if (!supabase) return;
  const a = await supabase.from("production_runs").delete().neq("id", "___none___");
  if (a.error) throw a.error;
  const b = await supabase.from("cancellations").delete().neq("id", "___none___");
  if (b.error) throw b.error;
}

export async function saveSingleton(table, row) {
  if (!supabase) return;
  const { error } = await supabase.from(table).upsert({ id: 1, ...row });
  if (error) throw error;
}

/* ---------- staff writes ----------
   Staff are written through a SECURITY DEFINER RPC so the PIN is handled entirely
   server-side: it's set when provided and left untouched otherwise. This sidesteps the
   column-level grants / batching pitfalls that were dropping PINs. Falls back to a plain
   upsert if the RPC hasn't been created yet (migration_v6 not run). */
const _isMissingFn = (e) => e && (e.code === "PGRST202" || /could not find the function|does not exist|schema cache/i.test(e.message || ""));
export async function upsertStaff(s) {
  if (!supabase) return;
  const args = {
    p_id: s.id,
    p_name: s.name || "",
    p_role: s.role || "production",
    p_wage: Number(s.wage) || 0,
    p_perms: Array.isArray(s.perms) ? s.perms : (s.role === "driver" ? [] : ["production"]),
    p_pin: s.pin ? String(s.pin) : null,
  };
  const { error } = await supabase.rpc("upsert_staff", args);
  if (!error) return;
  if (_isMissingFn(error)) { await upsertRows("staff", [staffToRow(s)]); return; }
  throw error;
}
export async function deleteStaff(id) {
  if (!supabase) return;
  const { error } = await supabase.rpc("delete_staff", { p_id: id });
  if (!error) return;
  if (_isMissingFn(error)) { await deleteByIds("staff", [id]); return; }
  throw error;
}

/* ---------- auth ---------- */
export async function verifyPin(pin) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("verify_pin", { p_pin: pin });
  if (error) throw error;
  return (data && data[0]) || null;
}

/* ---------- production write paths (mirror commitDistribution / cancel) ---------- */
export async function persistProduction({ storeUpserts, queueInserts, centralUpsert, runRow, recipeExpected, alert }) {
  if (!supabase) return;
  const ops = [];
  if (storeUpserts.length) ops.push(supabase.from("store_stock").upsert(storeUpserts));
  if (queueInserts.length) ops.push(supabase.from("delivery_queue").insert(queueInserts));
  if (centralUpsert) ops.push(supabase.from("central_stock").upsert(centralUpsert));
  ops.push(supabase.from("production_runs").insert(runRow));
  if (recipeExpected) ops.push(supabase.from("recipes").update({ expected_sec: recipeExpected.sec }).eq("id", recipeExpected.id));
  const results = await Promise.all(ops);
  for (const r of results) if (r.error) throw r.error;
  if (alert) {
    // keep one alert per recipe, matching the in-memory filter
    const d = await supabase.from("alerts").delete().eq("recipe", alert.recipe);
    if (d.error) throw d.error;
    const i = await supabase.from("alerts").insert(alert);
    if (i.error) throw i.error;
  }
}

export async function persistCancellation(row) {
  if (!supabase) return;
  const { error } = await supabase.from("cancellations").insert(row);
  if (error) throw error;
}

export async function clearQueueForLocation(locationId) {
  if (!supabase) return;
  const { error } = await supabase.from("delivery_queue").delete().eq("location_id", locationId);
  if (error) throw error;
}

// Admin: wipe all live stock (store + central) and the delivery queue.
export async function resetAllStock() {
  if (!supabase) return;
  const results = await Promise.all([
    supabase.from("store_stock").delete().neq("location_id", "___none___"),
    supabase.from("central_stock").delete().neq("recipe_id", "___none___"),
    supabase.from("delivery_queue").delete().neq("id", "___none___"),
  ]);
  for (const r of results) if (r.error) throw r.error;
}

/* ============================================================================
   Robust write queue.
   - Only the CHANGED rows are sent (never the whole collection), so one bad/blocked
     row can't take down everyone else, and we don't re-update untouched rows.
   - Changes accumulate per table and flush on a debounce, so rapid edits aren't lost.
   - On failure: stash to localStorage (replayed next load) and notify, then retry.
   ============================================================================ */
const pending = {};   // table -> Map(id -> row)
const flushTimers = {};
let syncErrorHandler = null;
export function setSyncErrorHandler(fn) { syncErrorHandler = fn; }

export function queueUpsert(table, rows) {
  if (!supabase || !rows.length) return;
  const m = (pending[table] ||= new Map());
  for (const r of rows) m.set(r.id, r);
  stashPending(table, m);          // durable IMMEDIATELY — survives a refresh/close before flush
  scheduleFlush(table, 600);
}
function stashPending(table, m) {
  try { if (m.size) localStorage.setItem("ronis_pending_" + table, JSON.stringify([...m.values()])); else localStorage.removeItem("ronis_pending_" + table); } catch {}
}
function scheduleFlush(table, ms) {
  clearTimeout(flushTimers[table]);
  flushTimers[table] = setTimeout(() => flushTable(table), ms);
}
async function flushTable(table) {
  const m = pending[table];
  if (!m || !m.size) return;
  const rows = [...m.values()];
  try {
    await upsertRows(table, rows);
    for (const r of rows) if (m.get(r.id) === r) m.delete(r.id);     // keep any newer edits queued
    stashPending(table, m);
  } catch (e) {
    console.error(`sync ${table} failed`, e);
    stashPending(table, m);
    if (syncErrorHandler) syncErrorHandler(table, e);
    scheduleFlush(table, 3000); // keep the rows queued and retry
  }
}

// Debounced save for singletons (cpu / delivery settings).
const singletonTimers = {};
export function scheduleSync(key, fn, ms = 700) {
  clearTimeout(singletonTimers[key]);
  singletonTimers[key] = setTimeout(() => { Promise.resolve(fn()).catch((e) => console.error(`sync ${key} failed`, e)); }, ms);
}
