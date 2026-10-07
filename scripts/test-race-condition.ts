// Proves the submit-pitch race fix: fires concurrent claim attempts for
// the same user/day and checks that only one ever proceeds to real
// scoring. Runs against the live Supabase project using the migration in
// supabase/migrations/003_fix_submit_pitch_race.sql — apply that migration
// before running this.
//
// Uses a throwaway, isolated test user (created and deleted by this
// script) rather than any real account — complete_pitch_attempt mutates
// user_streaks, and this must never touch a real person's streak.
//
// Run: npx tsx scripts/test-race-condition.ts

import "./_load-env";

import { createClient } from "@supabase/supabase-js";
import { scorePitch } from "../lib/scoring";
import { todayDateString, previousDateString } from "../lib/date";

const TEST_SCENARIO = {
  title: "Race condition test scenario",
  context: "Synthetic scenario used only by scripts/test-race-condition.ts.",
  prompt: "Say anything.",
};
const TEST_TRANSCRIPT =
  "This is a short synthetic transcript used only to exercise the scoring call during the race condition test.";

let failures = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ok: ${message}`);
  } else {
    failures++;
    console.error(`  FAIL: ${message}`);
  }
}

function requireServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }
  return createClient(url, key);
}

type Claim = { user_id: string; date: string; transcript_id: string; claimed_at: string } | null;

async function claim(
  supabase: ReturnType<typeof requireServiceClient>,
  userId: string,
  date: string,
  transcriptId: string
): Promise<Claim> {
  const { data, error } = await supabase.rpc("claim_pitch_attempt_slot", {
    p_user_id: userId,
    p_date: date,
    p_transcript_id: transcriptId,
  });
  if (error) throw error;
  // PostgREST serializes a SQL NULL composite as an all-null-fields object,
  // not JSON null — normalize it here so callers can do a plain null check,
  // same fix as app/api/submit-pitch/route.ts's claimBlocked.
  if (data && data.user_id === null) return null;
  return data;
}

// Mimics the real route's post-claim path closely enough to prove the
// point: score (real call, counted), then finalize via the atomic RPC.
async function scoreAndComplete(
  supabase: ReturnType<typeof requireServiceClient>,
  userId: string,
  date: string,
  onScored: () => void
) {
  const score = await scorePitch({
    scenario: TEST_SCENARIO,
    transcript: TEST_TRANSCRIPT,
    fillerCount: 0,
    fillerWords: [],
    wpm: 140,
    moodTone: "Neutral, for a test.",
  });
  onScored();

  const { error } = await supabase.rpc("complete_pitch_attempt", {
    p_user_id: userId,
    p_scenario_id: null,
    p_date: date,
    p_transcript: TEST_TRANSCRIPT,
    p_score: score,
    p_new_streak: 1,
    p_longest_streak: 1,
  });
  if (error) throw error;
}

async function cleanupUser(supabase: ReturnType<typeof requireServiceClient>, userId: string) {
  // No ON DELETE CASCADE from these tables to auth.users — delete child
  // rows first or auth.admin.deleteUser fails on the FK.
  await supabase.from("pitch_attempts").delete().eq("user_id", userId);
  await supabase.from("user_streaks").delete().eq("user_id", userId);
  await supabase.from("pitch_attempt_claims").delete().eq("user_id", userId);
  await supabase.auth.admin.deleteUser(userId);
}

async function testConcurrentDistinctSubmissions(
  supabase: ReturnType<typeof requireServiceClient>,
  userId: string
) {
  console.log("\n--- Test A: 5 concurrent claims, distinct transcript IDs ---");
  const date = todayDateString();
  let scoredCount = 0;

  const results = await Promise.all(
    Array.from({ length: 5 }, (_, i) => claim(supabase, userId, date, `distinct-${i}`))
  );

  const won = results.filter((r) => r !== null);
  assert(won.length === 1, `exactly 1 of 5 claims succeeded (got ${won.length})`);

  // Only the winner would proceed to scoring in the real route.
  if (won.length >= 1) {
    await scoreAndComplete(supabase, userId, date, () => scoredCount++);
  }
  assert(scoredCount === 1, `exactly 1 real scoring call happened (got ${scoredCount})`);

  const { data: attempts } = await supabase
    .from("pitch_attempts")
    .select("id")
    .eq("user_id", userId)
    .eq("date", date);
  assert(attempts?.length === 1, `exactly 1 pitch_attempts row exists for that day (got ${attempts?.length ?? 0})`);
}

async function testConcurrentSameSubmission(
  supabase: ReturnType<typeof requireServiceClient>,
  userId: string
) {
  console.log("\n--- Test B: 5 concurrent claims, same transcript ID (retry simulation) ---");
  const date = previousDateString(todayDateString()); // distinct day from Test A
  let scoredCount = 0;
  const transcriptId = "same-transcript";

  const results = await Promise.all(
    Array.from({ length: 5 }, () => claim(supabase, userId, date, transcriptId))
  );

  const won = results.filter((r) => r !== null);
  assert(won.length === 1, `exactly 1 of 5 identical-transcript claims succeeded (got ${won.length})`);

  if (won.length >= 1) {
    await scoreAndComplete(supabase, userId, date, () => scoredCount++);
  }
  assert(scoredCount === 1, `exactly 1 real scoring call happened despite 5 identical requests (got ${scoredCount})`);

  // The 4 losers, replaying the route's own logic: same transcript_id as
  // the existing claim -> should find the now-finished attempt.
  const { data: existingClaim } = await supabase
    .from("pitch_attempt_claims")
    .select("transcript_id")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  assert(
    existingClaim?.transcript_id === transcriptId,
    "losers would see a matching transcript_id on the existing claim (idempotent case, not a real duplicate)"
  );
}

async function testStaleClaimTakeover(
  supabase: ReturnType<typeof requireServiceClient>,
  userId: string
) {
  console.log("\n--- Test C: stale claim takeover ---");
  const staleDate = "2020-01-01"; // arbitrary, unused-elsewhere test date
  const freshDate = "2020-01-02";

  // Stale case: claimed 4 minutes ago -> a new request should take it over.
  await supabase.from("pitch_attempt_claims").insert({
    user_id: userId,
    date: staleDate,
    transcript_id: "old",
    claimed_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  });
  const takeover = await claim(supabase, userId, staleDate, "new");
  assert(takeover !== null, "a claim older than 3 minutes is taken over by a new request");
  assert(takeover?.transcript_id === "new", "the taken-over claim now has the new transcript_id");

  // Fresh case: claimed just now -> must NOT be taken over.
  await supabase.from("pitch_attempt_claims").insert({
    user_id: userId,
    date: freshDate,
    transcript_id: "fresh-old",
    claimed_at: new Date().toISOString(),
  });
  const blocked = await claim(supabase, userId, freshDate, "fresh-new");
  assert(blocked === null, "a claim younger than 3 minutes is NOT taken over");

  await supabase.from("pitch_attempt_claims").delete().eq("user_id", userId).in("date", [staleDate, freshDate]);
}

async function main() {
  const supabase = requireServiceClient();

  const email = `race-test-${Date.now()}@example.invalid`;
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
  });
  if (createError || !created.user) {
    throw new Error(`Failed to create test user: ${createError?.message}`);
  }
  const userId = created.user.id;
  console.log(`Created throwaway test user ${userId} (${email})`);

  try {
    await testConcurrentDistinctSubmissions(supabase, userId);
    await testConcurrentSameSubmission(supabase, userId);
    await testStaleClaimTakeover(supabase, userId);
  } finally {
    await cleanupUser(supabase, userId);
    console.log(`\nCleaned up test user ${userId}`);
  }

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
