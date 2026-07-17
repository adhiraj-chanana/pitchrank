import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { tierForStreak } from "@/lib/tiers";
import { todayDateString } from "@/lib/date";
import type { Scenario, Tier } from "@/lib/types";

export async function getStreakForUser(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_streaks")
    .select("current_streak")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.current_streak ?? 0;
}

async function pickRandomScenarioForTier(tier: Tier): Promise<Scenario> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scenarios")
    .select("*")
    .eq("tier", tier);

  if (error || !data || data.length === 0) {
    throw new Error(`No scenarios found for tier "${tier}"`);
  }

  return data[Math.floor(Math.random() * data.length)] as Scenario;
}

// The daily scenario is a single shared row keyed by date (per the fixed
// schema), so it's decided by whichever user's request creates it first —
// based on that user's tier at that moment.
export async function getOrCreateTodayScenario(
  userId: string
): Promise<Scenario> {
  const date = todayDateString();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("daily_scenarios")
    .select("scenario_id, scenarios(*)")
    .eq("date", date)
    .maybeSingle();

  if (existing?.scenarios) {
    return existing.scenarios as unknown as Scenario;
  }

  const streak = await getStreakForUser(userId);
  const tier = tierForStreak(streak);
  const scenario = await pickRandomScenarioForTier(tier);

  const service = createServiceClient();
  const { error: insertError } = await service
    .from("daily_scenarios")
    .upsert(
      { date, scenario_id: scenario.id },
      { onConflict: "date", ignoreDuplicates: true }
    );

  if (insertError) {
    throw insertError;
  }

  // Re-fetch in case a concurrent request won the race and inserted a
  // different scenario for today first.
  const { data: final } = await supabase
    .from("daily_scenarios")
    .select("scenario_id, scenarios(*)")
    .eq("date", date)
    .maybeSingle();

  return (final?.scenarios as unknown as Scenario) ?? scenario;
}
