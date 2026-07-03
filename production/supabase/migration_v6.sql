-- Migration v6 — reliable staff management + remove the demo/sample staff.
-- Run once in the Supabase SQL Editor. Safe to re-run.

-- 1. Remove the sample people that shipped with the app (keep the Admin account).
delete from staff where id in ('u1', 'u2', 'u3', 'd1');

-- 2. A SECURITY DEFINER upsert so the PIN is handled entirely server-side: it is set
--    when a value is given and LEFT UNCHANGED otherwise. This removes the column-grant
--    and batching pitfalls that were dropping PINs when saving staff from the browser.
create or replace function upsert_staff(
  p_id text, p_name text, p_role text, p_wage numeric, p_perms jsonb, p_pin text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into staff (id, name, role, wage, perms, pin)
  values (
    p_id,
    coalesce(p_name, ''),
    coalesce(p_role, 'production'),
    coalesce(p_wage, 0),
    coalesce(p_perms, '["production"]'::jsonb),
    coalesce(nullif(p_pin, ''), '0000')
  )
  on conflict (id) do update set
    name  = excluded.name,
    role  = excluded.role,
    wage  = excluded.wage,
    perms = excluded.perms,
    pin   = case when nullif(p_pin, '') is not null then p_pin else staff.pin end;
end;
$$;
revoke all on function upsert_staff(text, text, text, numeric, jsonb, text) from public;
grant execute on function upsert_staff(text, text, text, numeric, jsonb, text) to anon, authenticated;

-- 3. A matching delete (never lets the Admin account be removed).
create or replace function delete_staff(p_id text) returns void
language sql
security definer
set search_path = public
as $$
  delete from staff where id = p_id and role <> 'admin';
$$;
revoke all on function delete_staff(text) from public;
grant execute on function delete_staff(text) to anon, authenticated;
