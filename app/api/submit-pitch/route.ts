import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTodayScenario } from "@/lib/today-scenario";
import { scorePitch } from "@/lib/scoring";
import { todayDateString } from "@/lib/date";

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

  // The daily scenario is derived server-side rather than trusting the
  // client-supplied scenarioId, since it's a shared, date-keyed row.
  const scenario = await getOrCreateTodayScenario(user.id);

  let score;
  try {
    score = await scorePitch({
      scenario,
      transcript,
      fillerCount,
      fillerWords,
      wpm,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Scoring failed: ${message}` },
      { status: 502 }
    );
  }

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

  return NextResponse.json({ attemptId: attempt.id, score });
}
