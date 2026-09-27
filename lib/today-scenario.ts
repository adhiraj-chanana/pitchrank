import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { tierForStreak } from "@/lib/tiers";
import { todayDateString } from "@/lib/date";
import { DEFAULT_CATEGORY_SLUG, getCategoryBySlug } from "@/lib/categories";
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

async function pickRandomScenarioForTierAndCategory(
  tier: Tier,
  categoryId: string
): Promise<Scenario> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scenarios")
    .select("*")
    .eq("tier", tier)
    .eq("category_id", categoryId);

  if (error || !data || data.length === 0) {
    throw new Error(
      `No scenarios found for tier "${tier}" in category "${categoryId}"`
    );
  }

  return data[Math.floor(Math.random() * data.length)] as Scenario;
}

// The daily scenario is a single shared row keyed by (date, category), so
// it's decided by whichever user's request creates it first for that
// category — based on that user's tier at that moment. `categorySlug`
// defaults to the only category that exists today; passing a different
// slug is how a future category picker would use this same function
// without any other change here.
export async function getOrCreateTodayScenario(
  userId: string,
  categorySlug: string = DEFAULT_CATEGORY_SLUG,
  timeZone?: string
): Promise<Scenario> {
  const date = todayDateString(timeZone);
  const supabase = await createClient();
  const category = await getCategoryBySlug(categorySlug);

  const { data: existing } = await supabase
    .from("daily_scenarios")
    .select("scenario_id, scenarios(*)")
    .eq("date", date)
    .eq("category_id", category.id)
    .maybeSingle();

  if (existing?.scenarios) {
    return existing.scenarios as unknown as Scenario;
  }

  const streak = await getStreakForUser(userId);
  const tier = tierForStreak(streak);
  const scenario = await pickRandomScenarioForTierAndCategory(
    tier,
    category.id
  );

  const service = createServiceClient();
  const { error: insertError } = await service
    .from("daily_scenarios")
    .upsert(
      { date, category_id: category.id, scenario_id: scenario.id },
      { onConflict: "date,category_id", ignoreDuplicates: true }
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
    .eq("category_id", category.id)
    .maybeSingle();

  return (final?.scenarios as unknown as Scenario) ?? scenario;
}
