-- Fixes the double-submission race in /api/submit-pitch: two concurrent
-- requests could both pass the app-level "already submitted today" check,
-- both get scored, and both insert — burning AssemblyAI/Claude calls and
-- risking two pitch_attempts rows for the same user/day.
--
-- Run this entire file in the Supabase SQL editor (Project > SQL Editor > New
-- query) AFTER confirming scripts/find-duplicate-attempts.ts reports zero
-- duplicate (user_id, date) pairs — the unique index below will fail to
-- create if any exist. (Checked 2026-10-07: 13 total rows, 0 duplicates.)
--
-- This migration is additive and self-contained — no existing read path
-- touches pitch_attempt_claims or either function, so it's safe to run
-- before, during, or after the app code deploy that starts calling them.

-- ============================================================
-- 1. pitch_attempt_claims — the day's slot, claimed before paying for
--    AssemblyAI/Claude. Kept as a permanent per-day lock after success;
--    deleted by the app only when scoring fails, to let the user retry.
-- ============================================================

create table if not exists pitch_attempt_claims (
  user_id uuid not null references auth.users(id),
  date date not null,
  transcript_id text not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table pitch_attempt_claims enable row level security;

-- Deliberately no RLS policies — combined with the revoke below, this
-- table has zero access for anon/authenticated. Only service_role
-- (bypasses RLS) touches it, called server-side only from
-- app/api/submit-pitch/route.ts.
revoke all on table pitch_attempt_claims from public, anon, authenticated;

-- ============================================================
-- 2. claim_pitch_attempt_slot — atomic claim-or-take-over-if-stale.
--    A plain INSERT would just fail on conflict; the ON CONFLICT ... WHERE
--    form lets a request atomically take over a claim whose owner crashed
--    or lost its connection mid-scoring (claimed_at older than 3 minutes)
--    without a race between "check if stale" and "take it."
-- ============================================================

create or replace function claim_pitch_attempt_slot(
  p_user_id uuid,
  p_date date,
  p_transcript_id text
) returns pitch_attempt_claims
language plpgsql
as $$
declare
  v_claim pitch_attempt_claims;
begin
  insert into pitch_attempt_claims (user_id, date, transcript_id, claimed_at)
  values (p_user_id, p_date, p_transcript_id, now())
  on conflict (user_id, date) do update
    set transcript_id = excluded.transcript_id,
        claimed_at = excluded.claimed_at
    where pitch_attempt_claims.claimed_at < now() - interval '3 minutes'
  returning * into v_claim;

  -- FOUND is false when the ON CONFLICT's WHERE excluded the row, i.e. an
  -- active (non-stale) claim already exists and isn't ours to take.
  if not found then
    return null;
  end if;

  return v_claim;
end;
$$;

revoke all on function claim_pitch_attempt_slot(uuid, date, text) from public, anon, authenticated;
grant execute on function claim_pitch_attempt_slot(uuid, date, text) to service_role;

-- ============================================================
-- 3. complete_pitch_attempt — atomic finalize: the attempt insert and the
--    streak upsert succeed or fail together. Does NOT touch
--    pitch_attempt_claims — the claim row is kept as the day's lock on
--    success, only deleted by the app on scoring failure.
-- ============================================================

create or replace function complete_pitch_attempt(
  p_user_id uuid,
  p_scenario_id uuid,
  p_date date,
  p_transcript text,
  p_score jsonb,
  p_new_streak int,
  p_longest_streak int
) returns pitch_attempts
language plpgsql
as $$
declare
  v_attempt pitch_attempts;
begin
  insert into pitch_attempts (user_id, scenario_id, date, transcript, score, audio_url)
  values (p_user_id, p_scenario_id, p_date, p_transcript, p_score, null)
  returning * into v_attempt;

  insert into user_streaks (user_id, current_streak, longest_streak, last_completed_date)
  values (p_user_id, p_new_streak, p_longest_streak, p_date)
  on conflict (user_id) do update
    set current_streak = excluded.current_streak,
        longest_streak = excluded.longest_streak,
        last_completed_date = excluded.last_completed_date;

  return v_attempt;
end;
$$;

revoke all on function complete_pitch_attempt(uuid, uuid, date, text, jsonb, int, int) from public, anon, authenticated;
grant execute on function complete_pitch_attempt(uuid, uuid, date, text, jsonb, int, int) to service_role;

-- ============================================================
-- 4. Unique index — the hard DB-level backstop. Matches the real rule
--    (global per user per day, not per category — pitch_attempts has no
--    category_id at all). Plain CREATE UNIQUE INDEX, not CONCURRENTLY:
--    the table is small (13 rows as of this writing) and this statement
--    needs to run in the same editor session as the rest of this file.
-- ============================================================

create unique index if not exists pitch_attempts_user_date_key
  on pitch_attempts(user_id, date);
