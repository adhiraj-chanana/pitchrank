import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTodayScenario } from "@/lib/today-scenario";
import { todayDateString } from "@/lib/date";
import { nextTierProgress, streakProgressMessage } from "@/lib/tiers";
import { bossStateForScore, BOSS_STATE_CONFIG } from "@/lib/boss";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import type { PitchAttempt, PitchScore } from "@/lib/types";

function scoreBadgeColor(score: number): string {
  if (score >= 75) return "bg-success";
  if (score >= 50) return "bg-warning";
  return "bg-danger";
}

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
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10 max-w-4xl mx-auto w-full">
        <Logo href="/dashboard" />
        <div className="flex items-center gap-6">
          <Link
            href="/history"
            className="text-sm font-bold text-muted hover:text-foreground transition-colors"
          >
            History
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-5 sm:px-10 mb-8">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-4">
          <p className="text-white font-black text-lg sm:text-xl">
            Good morning, {name} 👋
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:block bg-white rounded-xl shadow-lg px-3 py-1.5">
              <p className="text-xs font-bold text-indigo-700 whitespace-nowrap">
                Don&apos;t break your streak.
              </p>
            </div>
            <Image
              src="/boss/boss-dismissive.png"
              alt="The boss, watching your streak"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-lg"
            />
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-[3px] border-orange-200 rounded-3xl shadow-lg px-8 py-8 mb-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-8xl leading-none">🔥</span>
            <span className="text-8xl font-black text-orange-500 leading-none">
              {currentStreak}
            </span>
          </div>
          <div className="w-full flex flex-col items-center sm:items-start gap-2">
            <span className="text-xs font-black text-orange-500 uppercase tracking-widest">
              Day streak
            </span>
            <p className="text-foreground font-bold text-center sm:text-left">
              {streakProgressMessage(currentStreak)}
            </p>
            {progress.nextTier && progress.streakForNextTier !== null && (
              <div className="w-full h-1.5 bg-orange-100 border border-orange-200 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-orange-400 rounded-full transition-all"
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
        </div>

        <div className="bg-indigo-600 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-widest text-indigo-200 font-black">
              Today&apos;s mission
            </span>
            <span className="text-xs uppercase tracking-wide text-accent font-bold bg-white rounded-full px-3 py-1">
              {scenario.tier}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mb-2">
            {scenario.title}
          </h2>
          <p className="text-sm text-indigo-200 font-medium mb-4 leading-relaxed">
            {scenario.context}
          </p>
          <div className="bg-indigo-500 rounded-xl p-4 mb-6">
            <p className="text-white italic font-medium leading-relaxed">
              <span className="text-2xl font-black text-indigo-300 align-top mr-1">
                &ldquo;
              </span>
              {scenario.prompt}
              <span className="text-2xl font-black text-indigo-300 align-top ml-1">
                &rdquo;
              </span>
            </p>
          </div>

          {todayAttempt ? (
            <div className="flex items-center justify-between bg-indigo-500 rounded-2xl p-4">
              <div>
                <div className="text-sm font-bold text-indigo-200">
                  Today&apos;s score
                </div>
                <div className="text-2xl font-black text-white">
                  {(todayAttempt.score as PitchScore | null)?.overall ?? "—"}
                </div>
              </div>
              <div className="text-sm font-bold text-indigo-200">
                Come back tomorrow 👋
              </div>
            </div>
          ) : (
            <Link
              href="/pitch"
              className="block w-full text-center bg-white hover:bg-indigo-50 text-accent font-bold py-4 rounded-full shadow-lg transition-all hover:scale-105"
            >
              Start Recording
            </Link>
          )}
        </div>

        <div>
          <h2 className="text-lg font-black text-foreground mb-4">
            Recent battles
          </h2>
          {recentAttempts && recentAttempts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {(
                recentAttempts as (PitchAttempt & {
                  scenarios: { title: string } | null;
                })[]
              ).map((attempt) => {
                const attemptScore = attempt.score?.overall ?? 0;
                const bossImage =
                  BOSS_STATE_CONFIG[bossStateForScore(attemptScore)].image;
                return (
                  <Link
                    key={attempt.id}
                    href={`/results?attemptId=${attempt.id}`}
                    className="flex items-center justify-between gap-4 bg-surface border-2 border-border rounded-2xl px-5 py-4 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <Image
                        src={bossImage}
                        alt=""
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover border-2 border-border shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-foreground font-bold truncate">
                          {attempt.scenarios?.title ?? "Scenario"}
                        </div>
                        <div className="text-xs font-medium text-muted mt-0.5">
                          {attempt.date}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-full text-white font-black ${scoreBadgeColor(
                        attemptScore
                      )}`}
                    >
                      {attempt.score?.overall ?? "—"}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-4 bg-surface border-2 border-border rounded-2xl px-5 py-6 shadow-lg">
              <Image
                src="/boss/boss-dismissive.png"
                alt=""
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover border-2 border-border shrink-0"
              />
              <p className="text-muted font-medium text-sm">
                No battles yet. What are you waiting for?
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
