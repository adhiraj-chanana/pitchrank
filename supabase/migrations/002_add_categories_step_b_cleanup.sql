-- Step B: cleanup migration — run this ONLY after 001_add_categories_step_a.sql
-- has been applied AND the app deploy using onConflict "date,category_id" in
-- lib/today-scenario.ts is confirmed fully rolled out (no old instances of
-- the app still targeting the plain `date` unique constraint).
--
-- Before running, confirm the actual constraint name in the Supabase SQL
-- editor with:
--   \d daily_scenarios
-- Postgres typically auto-names a single-column inline `unique` from a
-- `create table` statement as `daily_scenarios_date_key`, but don't assume —
-- verify against your own database before dropping.

alter table daily_scenarios drop constraint if exists daily_scenarios_date_key;

-- The composite unique index (date, category_id) added in Step A already
-- serves date-only lookups via its leading column, so the standalone
-- single-column index is now redundant.
drop index if exists idx_daily_scenarios_date;
