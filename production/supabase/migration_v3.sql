-- Migration v3 — single-site mode + yield warnings. Run once in Supabase SQL Editor.
-- Safe to re-run.

-- 1. "We bake & sell in the same place (no deliveries)" flag
alter table cpu add column if not exists single_site boolean not null default false;

-- 2. Alerts can now be time-drift OR yield warnings (with a free-text message)
alter table alerts add column if not exists kind text not null default 'time';
alter table alerts add column if not exists message text;
