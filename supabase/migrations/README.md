# Migrations

This project doesn't use a migration CLI/runner — `schema.sql` in the parent
directory is the source of truth for a fresh install, run by hand in the
Supabase SQL editor. Files in this folder are one-off migrations for
existing databases that already have data, applied in filename order.

## 001 / 002 — categories

Adds a `categories` table and reclassifies all existing scenarios under a
single `elevator-pitch` category, laying the groundwork for future
categories without requiring a schema change to add them later.

Run **001** first. It's purely additive (new table, new nullable-then-backfilled
columns, a new composite unique index) — safe to run before, during, or after
a code deploy, since it doesn't remove anything the old code depends on.

Deploy the app changes (`lib/today-scenario.ts` etc., using the new
`onConflict: "date,category_id"` target).

Run **002** only after that deploy is confirmed fully rolled out. It drops
the now-redundant single-column `unique(date)` constraint on
`daily_scenarios` that 001 deliberately left in place. Running 002 before
the deploy is complete would break any still-running old app instances that
target the old constraint name in their `onConflict`.

Ask Claude to re-derive the full design rationale if needed — including why
this two-step sequencing is a real constraint, not overcaution: the app has
no deploy/DB migration coordination, Vercel deploys aren't atomic, and
there's a rollout window where old and new code run concurrently.
