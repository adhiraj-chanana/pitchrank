-- PitchRank database schema
-- Run this entire file in the Supabase SQL editor (Project > SQL Editor > New query)

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create table if not exists scenarios (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  context text not null,
  prompt text not null,
  tier text not null check (tier in ('beginner','intermediate','advanced','expert')),
  category_id uuid not null references categories(id),
  created_at timestamptz default now()
);

-- One scenario per day, per category (not globally per day) — the unique
-- index below is the enforcement point.
create table if not exists daily_scenarios (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  category_id uuid not null references categories(id),
  scenario_id uuid references scenarios(id)
);

create table if not exists pitch_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  scenario_id uuid references scenarios(id),
  date date not null,
  transcript text,
  score jsonb,
  audio_url text,
  created_at timestamptz default now()
);

create table if not exists user_streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique,
  current_streak int default 0,
  longest_streak int default 0,
  last_completed_date date
);

-- The day's slot, claimed before paying for AssemblyAI/Claude — see
-- migrations/003_fix_submit_pitch_race.sql for the full design rationale
-- (stale-claim takeover, why this is a separate table rather than a
-- status column on pitch_attempts). Kept as a permanent per-day lock
-- after a successful submission; deleted by the app only on scoring
-- failure, to let the user retry.
create table if not exists pitch_attempt_claims (
  user_id uuid not null references auth.users(id),
  date date not null,
  transcript_id text not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- Helpful indexes
create index if not exists idx_pitch_attempts_user_id on pitch_attempts(user_id);
create index if not exists idx_pitch_attempts_user_date on pitch_attempts(user_id, date);
create index if not exists idx_scenarios_category_id on scenarios(category_id);
create index if not exists idx_scenarios_category_tier on scenarios(category_id, tier);

-- One scenario per (date, category) — see daily_scenarios comment above.
create unique index if not exists daily_scenarios_date_category_key
  on daily_scenarios(date, category_id);

-- The real daily-limit rule: global per user per day, not per category
-- (pitch_attempts has no category_id at all) — the hard DB-level backstop
-- behind the claim-based race fix below.
create unique index if not exists pitch_attempts_user_date_key
  on pitch_attempts(user_id, date);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table categories enable row level security;
alter table scenarios enable row level security;
alter table daily_scenarios enable row level security;
alter table pitch_attempts enable row level security;
alter table user_streaks enable row level security;

-- categories: public read
create policy "categories are publicly readable"
  on categories for select
  using (true);

-- scenarios: public read
create policy "scenarios are publicly readable"
  on scenarios for select
  using (true);

-- daily_scenarios: public read
create policy "daily_scenarios are publicly readable"
  on daily_scenarios for select
  using (true);

-- pitch_attempts: users can only read/write their own rows
create policy "users can read own pitch attempts"
  on pitch_attempts for select
  using (auth.uid() = user_id);

create policy "users can insert own pitch attempts"
  on pitch_attempts for insert
  with check (auth.uid() = user_id);

create policy "users can update own pitch attempts"
  on pitch_attempts for update
  using (auth.uid() = user_id);

-- user_streaks: users can only read/write their own row
create policy "users can read own streak"
  on user_streaks for select
  using (auth.uid() = user_id);

create policy "users can insert own streak"
  on user_streaks for insert
  with check (auth.uid() = user_id);

create policy "users can update own streak"
  on user_streaks for update
  using (auth.uid() = user_id);

-- pitch_attempt_claims: deliberately no policies. Combined with the
-- revoke below, this table has zero access for anon/authenticated —
-- only service_role (bypasses RLS), called server-side only.
alter table pitch_attempt_claims enable row level security;
revoke all on table pitch_attempt_claims from public, anon, authenticated;

-- ============================================================
-- FUNCTIONS — service-role-only RPCs for the submit-pitch race fix.
-- See migrations/003_fix_submit_pitch_race.sql for the full rationale.
-- ============================================================

-- Atomic claim-or-take-over-if-stale: a plain insert would just fail on
-- conflict; ON CONFLICT ... WHERE lets a request atomically take over a
-- claim whose owner crashed or lost its connection mid-scoring (claimed_at
-- older than 3 minutes) without a race between "check if stale" and
-- "take it." Returns null when an active (non-stale) claim blocks it.
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

  if not found then
    return null;
  end if;

  return v_claim;
end;
$$;

revoke all on function claim_pitch_attempt_slot(uuid, date, text) from public, anon, authenticated;
grant execute on function claim_pitch_attempt_slot(uuid, date, text) to service_role;

-- Atomic finalize: the attempt insert and the streak upsert succeed or
-- fail together. Does not touch pitch_attempt_claims — the claim row is
-- kept as the day's lock on success, only deleted by the app on failure.
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
-- SEED DATA — 1 category, 10 scenarios across 4 tiers
-- ============================================================

insert into categories (slug, name, description, sort_order) values
('elevator-pitch',
 'Elevator Pitch',
 'Fast, high-stakes pitch scenarios — networking events, cold intros, recruiters, and more.',
 0)
on conflict (slug) do nothing;

insert into scenarios (title, context, prompt, tier, category_id)
select v.title, v.context, v.prompt, v.tier, c.id
from (values
('The Stranger at a Networking Event',
 'You are at a tech networking event. Someone walks up and asks what you do.',
 'Hi! I don''t think we''ve met. What do you do?',
 'beginner'),

('The Career Fair Recruiter',
 'You are at a campus career fair. A recruiter from your dream company just made eye contact and smiled.',
 'Hey, what''s your background? We''re hiring across a few teams.',
 'beginner'),

('The Elevator Ride',
 'You step into an elevator with the CTO of a company you admire. You have 30 seconds before their floor.',
 'Going up? You look familiar — do we know each other?',
 'beginner'),

('The Uber Driver',
 'You are in an Uber. The driver asks what you do for work.',
 'So what do you do? You a student or working?',
 'beginner'),

('The Skeptical Investor',
 'You are at a startup event. A VC who has heard 500 pitches today reluctantly gives you 60 seconds.',
 'Alright, you have got one minute. What are you working on and why should I care?',
 'intermediate'),

('The Cold Coffee Chat',
 'A senior engineer agreed to a 15-minute coffee chat after you messaged them on LinkedIn. They seem busy.',
 'So, you wanted to chat. What''s on your mind? I''ve got about 10 minutes.',
 'intermediate'),

('The Referral Ask',
 'Your friend works at a company you want to join. You are asking them to refer you.',
 'I mean, I like you and all, but my manager is going to ask why I''m referring you. What do I tell them?',
 'intermediate'),

('The Panel Interview Opener',
 'You are in a panel interview with 4 people. They all stare at you waiting.',
 'So, tell us about yourself. Why are you here?',
 'advanced'),

('The Offer Negotiation',
 'You received a job offer. You are calling the recruiter to negotiate.',
 'Hi! We are excited to offer you the role. We are offering $95,000. Does that work for you?',
 'advanced'),

('The Cold Voicemail',
 'You called a hiring manager directly. They did not pick up. Leave a voicemail.',
 'You have reached Sarah Chen, Engineering Manager at Anthropic. Leave a message.',
 'expert')
) as v(title, context, prompt, tier)
cross join (select id from categories where slug = 'elevator-pitch') as c;
