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

## 003 — fix the submit-pitch double-submission race

Adds `pitch_attempt_claims` (claim a day's slot before paying for
AssemblyAI/Claude), two service-role-only RPCs (`claim_pitch_attempt_slot`,
`complete_pitch_attempt`), and a unique index on
`pitch_attempts(user_id, date)` — the real rule (global per user per day,
not per category).

Single step, no deploy-ordering concern like 001/002: nothing existing reads
`pitch_attempt_claims` or calls either function, so this is safe to run
any time relative to the app deploy. Before running it, confirm zero
duplicate `(user_id, date)` rows with `npx tsx scripts/find-duplicate-attempts.ts`
— the unique index creation fails if any exist. Ask Claude to re-derive the
full design (why a separate claims table instead of a status column on
pitch_attempts, the stale-claim takeover logic, the service-role lockdown)
if needed.
