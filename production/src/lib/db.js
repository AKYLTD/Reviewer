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
});
export const recToRow = (r) => ({
  id: r.id, name: r.name, category: r.category || null, department: r.department || null,
  dept2: r.dept2 || "Production", notes: r.notes || "", allergens: r.allergens || [],
  dietary: r.dietary || [], hero: r.hero ?? null, images: r.images ?? null,
  yield_kg: r.yieldKg ?? 10, yield_unit: r.yieldUnit || "kg", expected_sec: r.expectedSec ?? 0, steps: r.steps || [],
});

export const staffFromRow = (r) => ({ id: r.id, name: r.name, wage: Number(r.wage) || 0, role: r.role });
export const staffToRow = (s) => {
  const row = { id: s.id, name: s.name, wage: Number(s.wage) || 0, role: s.role || "production" };
  if (s.pin) row.pin = s.pin; // pin is write-only; only set it when an actual value was entered
  return row;
};

export const locFromRow = (r) => ({ id: r.id, name: r.name, address: r.address || "", distanceMi: Number(r.distance_mi) || 0, driveMin: Number(r.drive_min) || 0 });
export const locToRow = (l) => ({ id: l.id, name: l.name, address: l.address || "", distance_mi: Number(l.distanceMi) || 0, drive_min: Number(l.driveMin) || 0 });

const runFromRow = (r) => ({ id: r.id, recipeId: r.recipe_id, recipe: r.recipe, qty: Number(r.qty), unit: r.unit, by: r.by_name, totalSec: r.total_sec, labour: Number(r.labour), ingCost: Number(r.ing_cost), deliv: Number(r.deliv), total: Number(r.total), when: r.when_label, at: r.created_at });
const cancelFromRow = (r) => ({ id: r.id, recipe: r.recipe, qty: Number(r.qty), unit: r.unit, by: r.by_name, stoppedAtStep: r.stopped_at_step, totalSteps: r.total_steps, when: r.when_label });
const alertFromRow = (r) => ({ id: r.id, recipe: r.recipe, from: r.from_sec, to: r.to_sec, dir: r.dir, diff: r.diff, runs: r.runs, when: r.when_label });

/* ---------- initial load ---------- */
export async function loadAll() {
  if (!supabase) return null;
  const sel = (t, opts) => supabase.from(t).select("*", opts);
  const [ing, rec, stf, loc, cpuR, del, runs, cancels, alerts, store, central, queue] = await Promise.all([
    sel("ingredients"),
    sel("recipes"),
    supabase.from("staff").select("id,name,wage,role").neq("role", "admin"),
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

  const cpu = cpuR.data?.[0] ? { name: cpuR.data[0].name, address: cpuR.data[0].address || "" } : { name: "", address: "" };
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
  const { error } = await supabase.from(table).upsert(rows);
  if (error) throw error;
}
export async function deleteByIds(table, ids) {
  if (!supabase || !ids.length) return;
  const { error } = await supabase.from(table).delete().in("id", ids);
  if (error) throw error;
}

export async function saveSingleton(table, row) {
  if (!supabase) return;
  const { error } = await supabase.from(table).upsert({ id: 1, ...row });
  if (error) throw error;
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

/* ---------- debounce for noisy admin edits (per-keystroke) ---------- */
const timers = {};
export function scheduleSync(key, fn, ms = 700) {
  clearTimeout(timers[key]);
  timers[key] = setTimeout(() => { Promise.resolve(fn()).catch((e) => console.error(`sync ${key} failed`, e)); }, ms);
}
