-- Migration: per-staff permissions (Service Book / Production) — run in Supabase SQL Editor.
-- Safe to re-run. Sign-in keeps working; this only adds a `perms` column and
-- updates verify_pin to also return it.

-- 1. perms column on staff
alter table staff add column if not exists perms jsonb not null default '["production"]'::jsonb;

-- sensible defaults: production staff get both lanes, drivers get none (delivery only)
update staff set perms = '["production","sbook"]'::jsonb
  where role <> 'driver' and role <> 'admin' and (perms is null or perms = '[]'::jsonb or perms = '["production"]'::jsonb);
update staff set perms = '[]'::jsonb where role = 'driver';

-- 2. let the anon client read perms (for the Staff admin editor); pin stays hidden
grant select (perms) on staff to anon, authenticated;

-- 3. verify_pin now returns perms too (return signature changes → drop + recreate)
drop function if exists verify_pin(text);
create function verify_pin(p_pin text)
returns table (id text, name text, role text, wage numeric, perms jsonb)
language sql
security definer
set search_path = public
as $$
  select s.id, s.name, s.role, s.wage, s.perms
  from staff s
  where s.pin = p_pin
  limit 1;
$$;
revoke all on function verify_pin(text) from public;
grant execute on function verify_pin(text) to anon, authenticated;
