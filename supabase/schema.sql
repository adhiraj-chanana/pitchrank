-- PitchRank database schema
-- Run this entire file in the Supabase SQL editor (Project > SQL Editor > New query)

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists scenarios (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  context text not null,
  prompt text not null,
  tier text not null check (tier in ('beginner','intermediate','advanced','expert')),
  created_at timestamptz default now()
);

create table if not exists daily_scenarios (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
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

-- Helpful indexes
create index if not exists idx_pitch_attempts_user_id on pitch_attempts(user_id);
create index if not exists idx_pitch_attempts_user_date on pitch_attempts(user_id, date);
create index if not exists idx_daily_scenarios_date on daily_scenarios(date);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table scenarios enable row level security;
alter table daily_scenarios enable row level security;
alter table pitch_attempts enable row level security;
alter table user_streaks enable row level security;

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

-- ============================================================
-- SEED DATA — 10 scenarios across 4 tiers
-- ============================================================

insert into scenarios (title, context, prompt, tier) values
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
 'expert');
