-- Migration v5 — a lightweight "recipes_light" view for fast app loading.
-- Run once in the Supabase SQL Editor. Safe to re-run.
--
-- The app's recipe photos are stored as base64 inside the recipe rows (the hero image,
-- the images json, and each step's photo). Loading all of those up front is what makes
-- the app slow to open. This view returns everything the app needs to render lists and
-- run a production, but WITHOUT any of the images — so the first load is only a few KB.
-- The app then streams the images in afterwards, in the background.

create or replace view recipes_light as
select
  id, name, category, department, dept2, notes, allergens, dietary,
  yield_kg, yield_unit, expected_sec, as_component,
  coalesce(
    (select jsonb_agg(step - 'image' order by ord)
       from jsonb_array_elements(coalesce(steps, '[]'::jsonb)) with ordinality as t(step, ord)),
    '[]'::jsonb
  ) as steps
from recipes;

grant select on recipes_light to anon, authenticated;
