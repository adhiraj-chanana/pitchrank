-- Step A: additive category migration — safe to run against an existing
-- database with real data at any time, independent of the app deploy.
--
-- Run this entire file in the Supabase SQL editor (Project > SQL Editor > New query).
--
-- This step deliberately does NOT drop the existing daily_scenarios
-- `unique(date)` constraint — the new composite `(date, category_id)` unique
-- index coexists with it fine while only one category exists. Dropping the
-- old constraint is Step B (002_add_categories_step_b_cleanup.sql), run
-- separately once the app deploy using the new onConflict target is
-- confirmed fully rolled out. See supabase/migrations/README.md.

-- ============================================================
-- 1. categories table
-- ============================================================

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

alter table categories enable row level security;

create policy "categories are publicly readable"
  on categories for select
  using (true);

insert into categories (slug, name, description, sort_order)
values (
  'elevator-pitch',
  'Elevator Pitch',
  'Fast, high-stakes pitch scenarios — networking events, cold intros, recruiters, and more.',
  0
)
on conflict (slug) do nothing;

-- ============================================================
-- 2. scenarios.category_id
-- ============================================================

alter table scenarios add column if not exists category_id uuid references categories(id);

update scenarios
set category_id = (select id from categories where slug = 'elevator-pitch')
where category_id is null;

alter table scenarios alter column category_id set not null;

create index if not exists idx_scenarios_category_id on scenarios(category_id);
create index if not exists idx_scenarios_category_tier on scenarios(category_id, tier);

-- ============================================================
-- 3. daily_scenarios.category_id + per-category uniqueness
-- ============================================================

alter table daily_scenarios add column if not exists category_id uuid references categories(id);

update daily_scenarios
set category_id = (select id from categories where slug = 'elevator-pitch')
where category_id is null;

alter table daily_scenarios alter column category_id set not null;

-- Coexists with the original unique(date) constraint from schema.sql —
-- do not drop that constraint here, see Step B.
create unique index if not exists daily_scenarios_date_category_key
  on daily_scenarios(date, category_id);
