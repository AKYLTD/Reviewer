# CLAUDE.md — Roni's Production Floor

## What this project is
A production-management web app for **Roni's Bakery** (a London bakery with a central
production unit "CPU" and shop locations Ronis Belsize and Ronis SJW). It is used by
production staff on **wall-mounted tablets** and on phones. It runs the bake-floor
workflow end to end: staff sign in, pick a recipe, scale the quantity, work through
guided steps, then record where the finished product goes. Admins manage recipes,
ingredient costs, staff, locations and reports.

A complete, working **front-end prototype already exists** at `src/App.jsx` (a single
React component). It currently holds all state in memory with `useState`, so **data is
lost on refresh**. Your job is to turn this prototype into a **real, deployed app** with
a database, real authentication, and hosting — **without changing the design or UX.**

> The design, layout, fonts (Quicksand + Nunito Sans), colours (cream/rust/gold), and
> every interaction in `src/App.jsx` are final and approved. Preserve them exactly.
> You are adding a backend and persistence *behind* this UI, not redesigning it.

## The stack to build
- **Front end:** the existing React app in `src/App.jsx`. Scaffold it into a real
  project (Vite + React recommended). Keep the component intact; refactor only to wire
  in data.
- **Database + Auth:** **Supabase** (Postgres + Auth). All app state lives here.
- **Hosting:** **Vercel.**

## Core requirements
1. **Persistence** — every piece of state currently in `useState` must read/write to
   Supabase and survive refresh, shared across all devices in real time where practical.
   The state to migrate: recipes, ingredients, staff, locations, CPU details, delivery
   rates, production runs, cancellations, store stock, central (CPU) stock, delivery
   queue, and time-drift alerts.
2. **Recipe data load** — import the 56 real recipes in `data/recipes.json` into the
   database (see "Data" below). The app already contains an importer
   (`importBase44Json`) that converts this exact JSON shape into the app's internal
   recipe model — reuse its logic so behaviour matches the prototype.
3. **Auth / sign-in** — the app uses **PIN sign-in** per staff member, an **Admin PIN
   (0712)**, and roles: `production`, `driver`, `admin`. Back this with real accounts.
   PINs map to staff rows; keep the same on-screen PIN-pad UX. Do **not** weaken this to
   a single shared login — each person signs in as themselves so production runs are
   attributed correctly.
4. **Live stock for all users** — the "Stock" view (header button) shows live quantities
   of each recipe at every location and the CPU. It must reflect the database and update
   as productions complete.
5. **Square-ready** — leave the `deductSold(storeStock, location, recipeName, qty)` hook
   and its comment intact. A future Square integration will call it on each sale to
   subtract sold quantities from a location's stock. Do **not** build the Square
   integration now, but design the stock tables so it slots in cleanly later (a sale at a
   location decrements that location+recipe quantity).

## Data model (derive tables from these)
The prototype's internal shapes (see `src/App.jsx` for exact fields):
- **ingredients**: `{ id, name, unit (g|kg|ml|L|unit|tbsp|tsp|pinch|handful|bunch), cost }`
- **recipes**: `{ id, name, category, department, dept2 (Production|Service), notes,
  allergens[], dietary[], hero (image url), images{}, yieldKg, yieldUnit
  (kg|boxes|units|slices), expectedSec, steps[] }`
  - **step**: `{ text, image, use:[{ ingId, qty }], isTimed (bool), timerSec, estSec }`
    - `isTimed` = true only for genuine wait steps (proof/bake/boil with an explicit
      duration); those show a live countdown. All other steps show `estSec` as a
      *recommended target time only* (no countdown).
- **staff**: `{ id, name, pin, wage, role (production|driver|admin) }`
- **locations**: `{ id, name, address, distanceMi, driveMin }` (distance/time from CPU)
- **cpu**: `{ name, address }`
- **delivery**: `{ perMile, perHour }` (delivery cost = distance×perMile + (driveMin/60)×perHour)
- **production_runs**: `{ id, recipeId, recipe, qty, unit, by, totalSec, labour, ingCost,
  deliv, total, when }`
- **cancellations**: `{ id, recipe, qty, unit, by, stoppedAtStep, totalSteps, when }`
- **store_stock**: per location, per recipe quantity (production adds; sales will subtract)
- **central_stock**: per recipe quantity held at the CPU ("not for delivery")
- **delivery_queue**: per location, list of `{ recipe, qty, unit, by, when }` awaiting collection

## Data (the recipes)
`data/recipes.json` is an **array of 56 recipes** already cleaned and normalised from the
bakery's old Base44 app. Each item matches this shape:
```json
{
  "title": "Babka Cake",
  "category": "Cake",
  "department": "Pastry",
  "ingredients": [{ "name": "Flour", "quantity": 2.5, "unit": "kg" }, ...],
  "method": ["Mix all ingredients until smooth...", "Use 1.5kg of margarine..."],
  "notes": "",
  "allergen_tags": ["Gluten","Eggs","Milk"],
  "images": { "thumbnail": "https://...", "process": ["https://..."], "final": ["https://..."] }
}
```
Load these via the app's existing import logic so steps, per-step ingredient matching,
allergen/dietary detection, wait-step detection and recommended times are generated the
same way they are in the prototype.

### Known data caveats (flag to the user; don't silently "fix")
- **No yields in the source** — every recipe defaults to `yieldKg: 10, yieldUnit: "kg"`.
  Real yields must be set by the user in admin.
- **All ingredient costs are £0** — names imported, prices did not. User sets costs in
  admin (there is an Excel-paste importer in the UI).
- **A few source typos** ride along (e.g. "Chixken wings", "Chollah"). Leave them; the
  user edits per recipe.
- **Images are Base44 URLs** — they display only if those URLs are public. If they fail,
  the card falls back to a gradient; the user can re-upload via the built-in image upload.
- **Allergen/dietary tags are auto-suggested** from ingredients and are **not a legal
  allergen statement**. They can be wrong (e.g. feta → flags Milk but the auto "Vegan"
  tag must be removed by a human). Keep them editable; never present them as guaranteed.

## What "done" looks like
- App deployed to a Vercel URL the team can open on any tablet/phone.
- All 56 recipes loaded and persisted in Supabase.
- Staff can sign in by PIN; admin via 0712; data survives refresh and syncs across devices.
- Live stock view reflects the database.
- The `deductSold` hook and Square-ready stock design are intact for later.
- The UI looks and behaves identically to `src/App.jsx`.

## Hard rules
- **Do not redesign the UI.** Preserve fonts, colours, layout, copy, and interactions.
- **Do not build the Square integration yet** — only keep the app Square-ready.
- **Do not weaken auth** to a single shared login.
- When you hit a data caveat above, surface it to the user rather than guessing.
- Ask the user before anything destructive or anything that incurs cost.

See `BUILD_TASKS.md` for the ordered task list, and `docs/SETUP_FOR_ALON.md` for the
account setup the user (Alon) needs to do.
