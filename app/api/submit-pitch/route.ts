import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

  const timeZone = await getRequestTimeZone();
  const today = todayDateString(timeZone);

  // NOTE: this is a global one-pitch-per-day check, not per-category — with
  // only one category today that distinction is invisible. When a second
  // category is added, decide here whether the daily limit is global or
  // per-category, and resolve it together with the streak question (does
  // completing any one category advance the single global streak in
  // user_streaks below, or does that need to become per-category too?).
  const { data: existing } = await supabase
    .from("pitch_attempts")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", today)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "You've already submitted a pitch today." },
      { status: 409 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const transcript: string =
    typeof body.transcript === "string" ? body.transcript : "";
  const fillerCount: number =
    typeof body.fillerCount === "number" ? body.fillerCount : 0;
  const fillerWords: string[] = Array.isArray(body.fillerWords)
    ? body.fillerWords.filter((w: unknown): w is string => typeof w === "string")
    : [];
  const wpm: number = typeof body.wpm === "number" ? body.wpm : 0;

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

  // The daily scenario is derived server-side rather than trusting the
  // client-supplied scenarioId, since it's a shared, date-keyed row.
  const scenario = await getOrCreateTodayScenario(user.id, undefined, timeZone);

  const mood = getMoodForDate(new Date());

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

  const { data: attempt, error: insertError } = await supabase
    .from("pitch_attempts")
    .insert({
      user_id: user.id,
      scenario_id: scenario.id,
      date: today,
      transcript,
      score,
      audio_url: null,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: streakRow } = await supabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const yesterdayStr = previousDateString(today);

  const priorStreak = streakRow?.current_streak ?? 0;
  const newStreak =
    streakRow?.last_completed_date === yesterdayStr ? priorStreak + 1 : 1;
  const longestStreak = Math.max(streakRow?.longest_streak ?? 0, newStreak);

  const { error: streakError } = await supabase.from("user_streaks").upsert(
    {
      user_id: user.id,
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_completed_date: today,
    },
    { onConflict: "user_id" }
  );

  if (streakError) {
    return NextResponse.json({ error: streakError.message }, { status: 500 });
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
