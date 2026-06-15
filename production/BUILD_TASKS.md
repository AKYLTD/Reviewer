# BUILD_TASKS.md — ordered build plan

Work through these in order. Check in with the user (Alon) at each **[PAUSE]**.
Do not run destructive or paid actions without explicit approval.

## 0. Orient
- [ ] Read `CLAUDE.md` fully.
- [ ] Open `src/App.jsx` and map the in-memory state (the `useState` calls in `App`) and
      the data shapes. This is the source of truth for the data model.
- [ ] Open `data/recipes.json` and confirm it's an array of 56 recipe objects.

## 1. Scaffold the project
- [ ] Create a Vite + React project. Place the existing `src/App.jsx` as the app's root
      component, unchanged in look/behaviour. Get it running locally (`npm run dev`) with
      its current in-memory seed so you can confirm the UI renders before touching data.
- [ ] Add the viewport meta tag (`width=device-width, initial-scale=1`) to `index.html`
      for proper mobile rendering (the prototype is built responsive but can't set this).
- [ ] **[PAUSE]** Show the user the app running locally, identical to the prototype.

## 2. Supabase project + schema
- [ ] User creates a Supabase project and provides the project URL + anon key
      (and service-role key for server-side import only — never commit it).
- [ ] Create tables from the data model in `CLAUDE.md`: ingredients, recipes, recipe_steps
      (or recipes with a JSON steps column — your call, justify it), staff, locations, cpu,
      delivery_settings, production_runs, cancellations, store_stock, central_stock,
      delivery_queue, alerts.
- [ ] Add row-level security appropriate to a small trusted team; do not leave tables
      world-writable. Keep it simple but not open.
- [ ] **[PAUSE]** Confirm schema with the user before loading data.

## 3. Load the recipes
- [ ] Write a one-off import script that reads `data/recipes.json` and uses the SAME
      transformation logic as the app's `importBase44Json` / `importBase44Recipe`
      (auto-match ingredients to steps, detect wait steps, recommended times, allergen/
      dietary suggestion) so the stored data matches the prototype exactly.
- [ ] Insert ingredients (deduped, £0 cost) and all 56 recipes.
- [ ] Verify counts: 56 recipes, ~199 ingredients, ~193 steps (matches prototype).
- [ ] **[PAUSE]** Show the user the recipes loaded in the app from the database.

## 4. Wire persistence
- [ ] Replace each in-memory `useState` seed in `App` with reads from Supabase, and each
      setter with writes. Keep the component's external behaviour identical.
- [ ] Cover: recipes, ingredients, staff, locations, cpu, delivery settings, production
      runs, cancellations, store_stock, central_stock, delivery_queue, alerts.
- [ ] Ensure completing a production writes a run + updates stock + delivery queue, and a
      cancellation writes a cancellation row — same logic as the prototype's
      `commitDistribution` / `cancelProduction`.
- [ ] Confirm data survives refresh and is shared across two browsers/devices.
- [ ] **[PAUSE]** Demonstrate persistence to the user.

## 5. Auth
- [ ] Implement PIN sign-in backed by the staff table, preserving the on-screen PIN-pad
      UX. Admin PIN 0712 grants the admin role. Roles: production, driver, admin.
- [ ] Production runs must record WHICH staff member did them (for the By-person report).
- [ ] Do not replace this with a single shared login.
- [ ] **[PAUSE]** Confirm sign-in flows with the user.

## 6. Deploy
- [ ] User creates a Vercel account / connects the repo. Set env vars (Supabase URL +
      anon key) in Vercel — never in the committed code.
- [ ] Deploy. Confirm the live URL works on a phone and a tablet.
- [ ] **[PAUSE]** Hand the user the live URL.

## 7. Real-data setup (with the user)
- [ ] Walk the user through: setting real **yields** per recipe, entering **ingredient
      costs** (or pasting their cost list via the built-in Excel importer), reviewing
      **allergen/dietary** tags, adding **staff + PINs**, and setting **locations +
      delivery rates**.
- [ ] Reconfirm the data caveats from `CLAUDE.md` so nothing is assumed.

## 8. Pilot
- [ ] Recommend the user trials it with **one or two staff on one shift** before full
      rollout, to catch real-world issues (dirty hands, tablet mounting, lighting, voice).

## Stay Square-ready (do NOT build now)
- Keep `deductSold(...)` and its comment. Ensure store_stock is structured so a future
  sale at a location can decrement that location+recipe quantity. Note for later: map each
  Square catalog item → recipe + location, then call deductSold on each completed-sale
  webhook line item.
