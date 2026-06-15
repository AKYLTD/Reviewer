-- ============================================================================
-- Roni's Production Floor — Supabase schema (Task 2)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / ON CONFLICT.
--
-- Design notes
-- - Tables mirror the prototype's in-memory shapes in src/App.jsx exactly.
-- - recipes.steps is stored as JSONB (not a separate recipe_steps table):
--   the UI and importBase44Recipe always read/write a recipe with its ordered
--   steps[] as one object, and each step nests use:[{ingId,qty}]. A normalised
--   step/step-ingredient schema would add joins + reassembly for zero benefit
--   here, since steps are never queried independently of their recipe.
-- - allergens[], dietary[] and images{} are JSONB for the same reason.
-- - Stock is normalised to (location_id, recipe_id) so a future Square sale can
--   decrement exactly one location+recipe row (deductSold maps cleanly to it).
-- - Auth is PIN-based at the app layer using only the anon key (no Supabase Auth
--   user sessions). So RLS policies target the anon role. PINs are protected by
--   column-level grants + a SECURITY DEFINER verify_pin() so the public anon key
--   can sign a staff member in WITHOUT the pin column ever being selectable.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Reference / catalog tables
-- ---------------------------------------------------------------------------
create table if not exists ingredients (
  id         text primary key,
  name       text not null,
  unit       text not null default 'kg',
  cost       numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists recipes (
  id          text primary key,
  name        text not null,
  category    text,
  department  text,
  dept2       text default 'Production',          -- Production | Service
  notes       text default '',
  allergens   jsonb not null default '[]'::jsonb,
  dietary     jsonb not null default '[]'::jsonb,
  hero        text,
  images      jsonb,
  yield_kg    numeric not null default 10,        -- caveat: source had no yields
  yield_unit  text not null default 'kg',         -- kg | boxes | units | slices
  expected_sec integer not null default 0,
  steps       jsonb not null default '[]'::jsonb, -- [{text,image,use:[{ingId,qty}],isTimed,timerSec,estSec}]
  created_at  timestamptz not null default now()
);

create table if not exists staff (
  id         text primary key,
  name       text not null,
  pin        text not null,
  wage       numeric not null default 0,
  role       text not null default 'production'
             check (role in ('production','driver','admin')),
  created_at timestamptz not null default now()
);
-- One PIN must map to one person for unambiguous sign-in.
create unique index if not exists staff_pin_key on staff (pin);

create table if not exists locations (
  id          text primary key,
  name        text not null,
  address     text,
  distance_mi numeric not null default 0,   -- from CPU
  drive_min   numeric not null default 0,   -- from CPU
  created_at  timestamptz not null default now()
);

-- Singleton config rows (id is pinned to 1).
create table if not exists cpu (
  id      integer primary key default 1 check (id = 1),
  name    text not null default 'Roni''s CPU',
  address text
);

create table if not exists delivery_settings (
  id        integer primary key default 1 check (id = 1),
  per_mile  numeric not null default 1.10,
  per_hour  numeric not null default 12.0
);

-- ---------------------------------------------------------------------------
-- Operational tables (written by the floor as productions run)
-- ---------------------------------------------------------------------------
create table if not exists production_runs (
  id         text primary key,
  recipe_id  text references recipes(id) on delete set null,
  recipe     text not null,               -- denormalised name for reports
  qty        numeric not null default 0,
  unit       text,
  by_name    text,                        -- staff member who ran it (By-person report)
  total_sec  integer not null default 0,
  labour     numeric not null default 0,
  ing_cost   numeric not null default 0,
  deliv      numeric not null default 0,
  total      numeric not null default 0,
  when_label text,                        -- prototype's en-GB display string
  created_at timestamptz not null default now()
);
create index if not exists production_runs_recipe_id_idx on production_runs (recipe_id);
create index if not exists production_runs_created_at_idx on production_runs (created_at desc);

create table if not exists cancellations (
  id              text primary key,
  recipe          text not null,
  qty             numeric not null default 0,
  unit            text,
  by_name         text,
  stopped_at_step integer,
  total_steps     integer,
  when_label      text,
  created_at      timestamptz not null default now()
);

-- Live stock per location+recipe. Production ADDS; a future Square sale SUBTRACTS
-- (deductSold) from exactly this row. This is the Square-ready shape.
create table if not exists store_stock (
  location_id text not null references locations(id) on delete cascade,
  recipe_id   text not null references recipes(id) on delete cascade,
  qty         numeric not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (location_id, recipe_id)
);

-- Stock held at the CPU ("not for delivery"), per recipe.
create table if not exists central_stock (
  recipe_id  text primary key references recipes(id) on delete cascade,
  qty        numeric not null default 0,
  updated_at timestamptz not null default now()
);

-- Items produced and waiting at the CPU for a driver to collect for a location.
create table if not exists delivery_queue (
  id          text primary key,
  location_id text not null references locations(id) on delete cascade,
  recipe_id   text references recipes(id) on delete set null,
  recipe      text not null,
  qty         numeric not null default 0,
  unit        text,
  by_name     text,
  when_label  text,
  created_at  timestamptz not null default now()
);
create index if not exists delivery_queue_location_idx on delivery_queue (location_id);

-- Admin alerts when a recipe's rolling-average time drifts from its set time.
create table if not exists alerts (
  id         text primary key,
  recipe     text not null,
  from_sec   integer,
  to_sec     integer,
  dir        text,            -- 'up' | 'down'
  diff       integer,
  runs       integer,
  when_label text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row-Level Security
-- Small trusted internal team; the app talks to Supabase with the public anon
-- key only. RLS is ENABLED on every table (nothing is open by default), and
-- the anon role is granted the operations the floor app actually performs.
-- The one secret — staff PINs — is never selectable (see column grants below).
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'ingredients','recipes','staff','locations','cpu','delivery_settings',
    'production_runs','cancellations','store_stock','central_stock',
    'delivery_queue','alerts'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    -- read
    execute format('drop policy if exists %I on %I;', t||'_sel', t);
    execute format($p$create policy %I on %I for select to anon, authenticated using (true);$p$,
                   t||'_sel', t);
    -- write (insert / update / delete) — trusted internal app
    execute format('drop policy if exists %I on %I;', t||'_ins', t);
    execute format($p$create policy %I on %I for insert to anon, authenticated with check (true);$p$,
                   t||'_ins', t);
    execute format('drop policy if exists %I on %I;', t||'_upd', t);
    execute format($p$create policy %I on %I for update to anon, authenticated using (true) with check (true);$p$,
                   t||'_upd', t);
    execute format('drop policy if exists %I on %I;', t||'_del', t);
    execute format($p$create policy %I on %I for delete to anon, authenticated using (true);$p$,
                   t||'_del', t);
  end loop;
end $$;

-- Protect PINs: anon/authenticated may write staff (admin manages people) and
-- read every staff column EXCEPT pin. Sign-in goes through verify_pin() only.
revoke select on staff from anon, authenticated;
grant select (id, name, wage, role, created_at) on staff to anon, authenticated;

-- SECURITY DEFINER sign-in: returns the matching staff member (no pin) or nothing.
-- Runs as the function owner, bypassing the column restriction above so it can
-- check the pin server-side without ever exposing it to the client.
create or replace function verify_pin(p_pin text)
returns table (id text, name text, role text, wage numeric)
language sql
security definer
set search_path = public
as $$
  select s.id, s.name, s.role, s.wage
  from staff s
  where s.pin = p_pin
  limit 1;
$$;
revoke all on function verify_pin(text) from public;
grant execute on function verify_pin(text) to anon, authenticated;

-- ============================================================================
-- Starting defaults (editable later in Admin — Task 7).
-- Recipes + ingredients are loaded separately by the import script (Task 3).
-- The Admin row (PIN 0712) gives admin access exactly as the prototype does.
-- ============================================================================
insert into cpu (id, name, address)
values (1, 'Roni''s CPU', 'Unit 4, Cricklewood Trading Estate, London NW2')
on conflict (id) do nothing;

insert into delivery_settings (id, per_mile, per_hour)
values (1, 1.10, 12.0)
on conflict (id) do nothing;

insert into staff (id, name, pin, wage, role) values
  ('admin', 'Admin',      '0712', 0,    'admin'),
  ('u1',    'Marco',      '1234', 14.5, 'production'),
  ('u2',    'Aylin',      '2222', 13.0, 'production'),
  ('u3',    'Tomas',      '3333', 15.5, 'production'),
  ('d1',    'Driver Sam', '9999', 12.0, 'driver')
on conflict (id) do nothing;

insert into locations (id, name, address, distance_mi, drive_min) values
  ('belsize', 'Ronis Belsize', 'Belsize Lane, London NW3',          4.2, 18),
  ('sjw',     'Ronis SJW',     'Circus Road, St John''s Wood NW8',  3.1, 14)
on conflict (id) do nothing;
