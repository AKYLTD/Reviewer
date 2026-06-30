-- Migration v4 — let a recipe be used as an ingredient/component in other recipes.
-- Run once in Supabase SQL Editor. Safe to re-run.
alter table recipes add column if not exists as_component boolean not null default false;
