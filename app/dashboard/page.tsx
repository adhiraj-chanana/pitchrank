import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTodayScenario } from "@/lib/today-scenario";
import { todayDateString } from "@/lib/date";
import { nextTierProgress, TIER_LABELS } from "@/lib/tiers";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import type { PitchAttempt, PitchScore } from "@/lib/types";

export default async function DashboardPage() {
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

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10 max-w-4xl mx-auto w-full">
        <Logo href="/dashboard" />
        <div className="flex items-center gap-6">
          <Link
            href="/history"
            className="text-sm text-muted hover:text-white transition-colors"
          >
            History
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pb-20">
        <p className="text-muted text-sm mb-1">Welcome back, {name}</p>

        <div className="flex items-center gap-3 mb-8">
          <span className="text-5xl">🔥</span>
          <div>
            <div className="text-4xl font-bold text-white leading-none">
              {currentStreak}
            </div>
            <div className="text-sm text-muted mt-1">day streak</div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wide text-accent font-semibold">
              {TIER_LABELS[progress.currentTier]} tier
            </span>
            {progress.nextTier && (
              <span className="text-xs text-muted">
                {progress.streaksRemaining} day
                {progress.streaksRemaining === 1 ? "" : "s"} to{" "}
                {TIER_LABELS[progress.nextTier]}
              </span>
            )}
          </div>
          {progress.nextTier && progress.streakForNextTier !== null && (
            <div className="w-full h-2 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (currentStreak / progress.streakForNextTier) * 100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Today&apos;s scenario
            </h2>
            <span className="text-xs uppercase tracking-wide text-muted border border-border rounded-full px-2.5 py-1">
              {scenario.tier}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {scenario.title}
          </h3>
          <p className="text-sm text-muted mb-4 leading-relaxed">
            {scenario.context}
          </p>
          <p className="text-white italic mb-6">&ldquo;{scenario.prompt}&rdquo;</p>

          {todayAttempt ? (
            <div className="flex items-center justify-between bg-background border border-border rounded-xl p-4">
              <div>
                <div className="text-sm text-muted">Today&apos;s score</div>
                <div className="text-2xl font-bold text-white">
                  {(todayAttempt.score as PitchScore | null)?.overall ?? "—"}
                </div>
              </div>
              <div className="text-sm text-muted">Come back tomorrow 👋</div>
            </div>
          ) : (
            <Link
              href="/pitch"
              className="inline-block w-full text-center bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Start Recording
            </Link>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent attempts
          </h2>
          {recentAttempts && recentAttempts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {(
                recentAttempts as (PitchAttempt & {
                  scenarios: { title: string } | null;
                })[]
              ).map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between bg-surface border border-border rounded-xl px-5 py-4"
                >
                  <div>
                    <div className="text-white font-medium">
                      {attempt.scenarios?.title ?? "Scenario"}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {attempt.date}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-accent">
                    {attempt.score?.overall ?? "—"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">
              No attempts yet — record your first pitch today.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
