import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/date";
import { getRequestTimeZone } from "@/lib/timezone";
import { ResultsReveal } from "./ResultsReveal";
import type { PitchScore } from "@/lib/types";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ attemptId?: string }>;
}) {
  const { attemptId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const query = supabase
    .from("pitch_attempts")
    .select("*, scenarios(title)")
    .eq("user_id", user.id);

  const { data: attempt } = attemptId
    ? await query.eq("id", attemptId).maybeSingle()
    : await query.eq("date", todayDateString(await getRequestTimeZone())).maybeSingle();

  if (!attempt) {
    redirect("/pitch");
  }

  const { data: streakRow } = await supabase
    .from("user_streaks")
    .select("current_streak")
    .eq("user_id", user.id)
    .maybeSingle();

  const scenarioTitle =
    (attempt as unknown as { scenarios: { title: string } | null }).scenarios
      ?.title ?? "Today's pitch";

  return (
    <ResultsReveal
      scenarioTitle={scenarioTitle}
      score={attempt.score as PitchScore}
      transcript={attempt.transcript ?? ""}
      streakCount={streakRow?.current_streak ?? 1}
    />
  );
}
