import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTodayScenario } from "@/lib/today-scenario";
import { scorePitch, generateBossDialogue } from "@/lib/scoring";
import { bossStateForScore, FALLBACK_BOSS_DIALOGUE } from "@/lib/boss";
import { todayDateString } from "@/lib/date";
import { getMoodForDate } from "@/lib/marcusMood";
import type { Milestone, PitchScore } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = todayDateString();

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

  if (!transcript || transcript.trim().length < 10) {
    return NextResponse.json(
      { error: "Transcript too short to score" },
      { status: 400 }
    );
  }

  // The daily scenario is derived server-side rather than trusting the
  // client-supplied scenarioId, since it's a shared, date-keyed row.
  const scenario = await getOrCreateTodayScenario(user.id);

  const mood = getMoodForDate(new Date());

  let scoreWithoutDialogue;
  try {
    scoreWithoutDialogue = await scorePitch({
      scenario,
      transcript,
      fillerCount,
      fillerWords,
      wpm,
      moodTone: mood.dialogueTone,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Scoring failed: ${message}` },
      { status: 502 }
    );
  }

  const moodAdjustedOverall = Math.min(
    100,
    Math.max(0, scoreWithoutDialogue.overall + mood.scoringModifier)
  );

  const bossState = bossStateForScore(moodAdjustedOverall);

  // Dialogue is flavor, not the core score — fall back rather than failing
  // the whole submission if Claude's second call has a hiccup.
  let bossDialogue: string[];
  try {
    bossDialogue = await generateBossDialogue({
      overall: moodAdjustedOverall,
      state: bossState,
      transcript,
      moodTone: mood.dialogueTone,
    });
  } catch {
    bossDialogue = FALLBACK_BOSS_DIALOGUE[bossState];
  }

  const score: PitchScore = {
    ...scoreWithoutDialogue,
    overall: moodAdjustedOverall,
    boss_dialogue: bossDialogue,
    mood: { name: mood.name, emoji: mood.emoji },
  };

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

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

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

  const milestone: Milestone | null =
    newStreak === 7 || newStreak === 14 || newStreak === 30 ? newStreak : null;

  return NextResponse.json({
    attemptId: attempt.id,
    score,
    milestone,
    mood: { name: mood.name, emoji: mood.emoji },
  });
}
