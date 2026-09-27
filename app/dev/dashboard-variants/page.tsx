import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTodayScenario } from "@/lib/today-scenario";
import { todayDateString } from "@/lib/date";
import { nextTierProgress } from "@/lib/tiers";
import { getMoodForDate } from "@/lib/marcusMood";
import { VariantSwitcher } from "./VariantSwitcher";
import type { PitchAttempt } from "@/lib/types";

// Dev-only route for comparing dashboard layout prototypes on a phone.
// Not linked from any nav — visit directly. Delete this whole
// app/dev/dashboard-variants directory once a winner is picked.
export default async function DashboardVariantsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: streakRow } = await supabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const currentStreak = streakRow?.current_streak ?? 0;
  const progress = nextTierProgress(currentStreak);

  const today = todayDateString();
  const { data: todayAttempt } = await supabase
    .from("pitch_attempts")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .maybeSingle();

  const scenario = await getOrCreateTodayScenario(user.id);

  const { data: recentAttempts } = await supabase
    .from("pitch_attempts")
    .select("*, scenarios(title)")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(3);

  const name = (user.user_metadata?.name as string | undefined) ?? "there";
  const mood = getMoodForDate(new Date());

  return (
    <VariantSwitcher
      data={{
        name,
        currentStreak,
        progress,
        scenario,
        mood,
        todayAttempt: (todayAttempt as PitchAttempt | null) ?? null,
        recentAttempts:
          (recentAttempts as (PitchAttempt & {
            scenarios: { title: string } | null;
          })[]) ?? [],
      }}
    />
  );
}
