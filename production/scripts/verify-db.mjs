/* Read-only end-to-end check of the persistence layer against the live database.
   Uses the same db.js the app uses. Requires network egress to *.supabase.co.
     node --env-file=.env.local scripts/verify-db.mjs
*/
import { loadAll, verifyPin } from "../src/lib/db.js";

const d = await loadAll();
if (!d) { console.error("No Supabase client — check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY."); process.exit(1); }

console.log("Loaded from database:");
console.log(`  recipes:      ${d.recipes.length}  (expect 56)`);
console.log(`  ingredients:  ${d.ingredients.length}  (expect 195)`);
console.log(`  staff:        ${d.staff.length}  -> ${d.staff.map((s) => `${s.name}/${s.role}`).join(", ")}`);
console.log(`  locations:    ${d.locations.length}  -> ${d.locations.map((l) => l.name).join(", ")}`);
console.log(`  cpu:          ${d.cpu.name}`);
console.log(`  delivery:     £${d.delivery.perMile}/mi, £${d.delivery.perHour}/hr`);
console.log(`  runs/cancels/alerts: ${d.runs.length}/${d.cancellations.length}/${d.alerts.length}`);

const marco = await verifyPin("1234");
const nobody = await verifyPin("0000");
console.log("\nAuth (verify_pin):");
console.log(`  PIN 1234 -> ${marco ? marco.name + " (" + marco.role + ")" : "no match"}  (expect Marco)`);
console.log(`  PIN 0000 -> ${nobody ? nobody.name : "no match"}  (expect no match)`);
console.log(`  PIN 1234 returns no 'pin' field: ${marco && !("pin" in marco)}  (pins stay server-side)`);

const ok = d.recipes.length === 56 && d.ingredients.length === 195 && marco?.name === "Marco" && !nobody;
console.log(`\n${ok ? "PASS" : "CHECK"} — core load + auth ${ok ? "verified" : "did not match expectations"}.`);
