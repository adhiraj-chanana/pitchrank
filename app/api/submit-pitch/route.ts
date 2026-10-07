import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getOrCreateTodayScenario } from "@/lib/today-scenario";
import { scorePitch, generateBossDialogue } from "@/lib/scoring";
import { bossStateForScore, FALLBACK_BOSS_DIALOGUE } from "@/lib/boss";
import { todayDateString, previousDateString } from "@/lib/date";
import { getRequestTimeZone } from "@/lib/timezone";
import { getMoodForDate } from "@/lib/marcusMood";
import { logPitchBenchmark, type TokenUsage } from "@/lib/benchmark";
import type { Milestone, PitchScore } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;

  // Computed once and reused for the claim, the scenario lookup, and the
  // final attempt row — never recomputed later in this function, so a
  // slow request spanning a local-midnight rollover can't end up with the
  // claim and the finalized attempt disagreeing on which day they're for.
  const timeZone = await getRequestTimeZone();
  const today = todayDateString(timeZone);

  const body = await request.json().catch(() => ({}));
  const transcript: string =
    typeof body.transcript === "string" ? body.transcript : "";
  const fillerCount: number =
    typeof body.fillerCount === "number" ? body.fillerCount : 0;
  const fillerWords: string[] = Array.isArray(body.fillerWords)
    ? body.fillerWords.filter((w: unknown): w is string => typeof w === "string")
    : [];
  const wpm: number = typeof body.wpm === "number" ? body.wpm : 0;
  const transcriptId: string =
    typeof body.transcriptId === "string" ? body.transcriptId : "";

  // Client-observed phases (upload, transcription) forwarded only for the
  // benchmark log line below — never read for anything else.
  const clientBenchmark = {
    uploadMs: typeof body.benchmark?.uploadMs === "number" ? body.benchmark.uploadMs : 0,
    transcribeSubmitMs:
      typeof body.benchmark?.transcribeSubmitMs === "number" ? body.benchmark.transcribeSubmitMs : 0,
    transcribeWaitMs:
      typeof body.benchmark?.transcribeWaitMs === "number" ? body.benchmark.transcribeWaitMs : 0,
    audioDurationSeconds:
      typeof body.benchmark?.audioDurationSeconds === "number" ? body.benchmark.audioDurationSeconds : 0,
  };

  if (!transcript || transcript.trim().length < 10) {
    return NextResponse.json(
      { error: "Transcript too short to score" },
      { status: 400 }
    );
  }

  if (!transcriptId) {
    return NextResponse.json({ error: "transcriptId is required" }, { status: 400 });
  }

  // Service role only below this point: pitch_attempt_claims and both RPCs
  // have execute/access revoked from anon/authenticated, by design (see
  // supabase/migrations/003_fix_submit_pitch_race.sql) — this route is the
  // only caller.
  const serviceSupabase = createServiceClient();

  const { data: claim, error: claimError } = await serviceSupabase.rpc(
    "claim_pitch_attempt_slot",
    { p_user_id: userId, p_date: today, p_transcript_id: transcriptId }
  );

  if (claimError) {
    return NextResponse.json({ error: claimError.message }, { status: 500 });
  }

  // PostgREST serializes a plpgsql function's SQL NULL return (composite
  // type) as an object with every field null, not JSON null — `!claim`
  // alone is always false here, so it must be checked explicitly.
  const claimBlocked = !claim || claim.user_id === null;

  if (claimBlocked) {
    // An active (non-stale) claim already exists for today. Figure out
    // whether this is the same submission retrying (network failure after
    // the original request actually succeeded) or a genuine second pitch.
    const { data: existingClaim } = await serviceSupabase
      .from("pitch_attempt_claims")
      .select("transcript_id")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle();

    if (existingClaim?.transcript_id === transcriptId) {
      const { data: existingAttempt } = await serviceSupabase
        .from("pitch_attempts")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();

      if (existingAttempt) {
        // Same submission, already finished — return the original result
        // instead of erroring or re-scoring.
        const { data: streakRow } = await serviceSupabase
          .from("user_streaks")
          .select("current_streak")
          .eq("user_id", userId)
          .maybeSingle();
        const currentStreak = streakRow?.current_streak ?? 0;
        const milestone: Milestone | null =
          currentStreak === 7 || currentStreak === 14 || currentStreak === 30
            ? currentStreak
            : null;

        return NextResponse.json({
          attemptId: existingAttempt.id,
          score: existingAttempt.score,
          milestone,
          mood: (existingAttempt.score as PitchScore | null)?.mood ?? null,
        });
      }

      // Same submission, still being scored by the original request.
      return NextResponse.json(
        { error: "Your pitch is still being processed. Please wait a moment." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "You've already submitted a pitch today." },
      { status: 409 }
    );
  }

  // The daily scenario is derived server-side rather than trusting the
  // client-supplied scenarioId, since it's a shared, date-keyed row.
  const scenario = await getOrCreateTodayScenario(userId, undefined, timeZone);

  const mood = getMoodForDate(new Date());

  async function releaseClaim() {
    await serviceSupabase
      .from("pitch_attempt_claims")
      .delete()
      .eq("user_id", userId)
      .eq("date", today);
  }

  let scoringTokens: TokenUsage = { inputTokens: 0, outputTokens: 0 };
  let scoreWithoutDialogue;
  const scoringStart = Date.now();
  try {
    scoreWithoutDialogue = await scorePitch(
      {
        scenario,
        transcript,
        fillerCount,
        fillerWords,
        wpm,
        moodTone: mood.dialogueTone,
      },
      (usage) => {
        scoringTokens = usage;
      }
    );
  } catch (err) {
    await releaseClaim();
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Scoring failed: ${message}` },
      { status: 502 }
    );
  }
  const scoringCallMs = Date.now() - scoringStart;

  const moodAdjustedOverall = Math.min(
    100,
    Math.max(0, scoreWithoutDialogue.overall + mood.scoringModifier)
  );

  const bossState = bossStateForScore(moodAdjustedOverall);

  // Dialogue is flavor, not the core score — fall back rather than failing
  // the whole submission if Claude's second call has a hiccup.
  let bossDialogueTokens: TokenUsage = { inputTokens: 0, outputTokens: 0 };
  let bossDialogue: string[];
  const bossDialogueStart = Date.now();
  try {
    bossDialogue = await generateBossDialogue(
      {
        overall: moodAdjustedOverall,
        state: bossState,
        transcript,
        moodTone: mood.dialogueTone,
      },
      (usage) => {
        bossDialogueTokens = usage;
      }
    );
  } catch {
    bossDialogue = FALLBACK_BOSS_DIALOGUE[bossState];
  }
  const bossDialogueCallMs = Date.now() - bossDialogueStart;

  const score: PitchScore = {
    ...scoreWithoutDialogue,
    overall: moodAdjustedOverall,
    boss_dialogue: bossDialogue,
    mood: { name: mood.name, emoji: mood.emoji },
  };

  const dbWritesStart = Date.now();

  const { data: streakRow } = await serviceSupabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const yesterdayStr = previousDateString(today);

  const priorStreak = streakRow?.current_streak ?? 0;
  const newStreak =
    streakRow?.last_completed_date === yesterdayStr ? priorStreak + 1 : 1;
  const longestStreak = Math.max(streakRow?.longest_streak ?? 0, newStreak);

  // Attempt insert + streak upsert in one transaction, via RPC — succeed
  // or fail together. The claim row is deliberately left in place on
  // success (it's the day's permanent lock); only released on failure.
  const { data: attempt, error: completeError } = await serviceSupabase.rpc(
    "complete_pitch_attempt",
    {
      p_user_id: userId,
      p_scenario_id: scenario.id,
      p_date: today,
      p_transcript: transcript,
      p_score: score,
      p_new_streak: newStreak,
      p_longest_streak: longestStreak,
    }
  );

  if (completeError || !attempt) {
    await releaseClaim();
    return NextResponse.json(
      { error: completeError?.message ?? "Failed to save pitch attempt." },
      { status: 500 }
    );
  }

  const dbWritesMs = Date.now() - dbWritesStart;

  const milestone: Milestone | null =
    newStreak === 7 || newStreak === 14 || newStreak === 30 ? newStreak : null;

  logPitchBenchmark({
    timestamp: new Date().toISOString(),
    attemptId: attempt.id,
    audioDurationSeconds: clientBenchmark.audioDurationSeconds,
    ms: {
      audioUpload: clientBenchmark.uploadMs,
      transcribeSubmit: clientBenchmark.transcribeSubmitMs,
      transcribeWait: clientBenchmark.transcribeWaitMs,
      scoringCall: scoringCallMs,
      bossDialogueCall: bossDialogueCallMs,
      dbWrites: dbWritesMs,
      total:
        clientBenchmark.uploadMs +
        clientBenchmark.transcribeSubmitMs +
        clientBenchmark.transcribeWaitMs +
        scoringCallMs +
        bossDialogueCallMs +
        dbWritesMs,
    },
    tokens: {
      scoring: scoringTokens,
      bossDialogue: bossDialogueTokens,
    },
  });

  return NextResponse.json({
    attemptId: attempt.id,
    score,
    milestone,
    mood: { name: mood.name, emoji: mood.emoji },
  });
}
