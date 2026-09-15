import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTodayScenario } from "@/lib/today-scenario";
import { todayDateString } from "@/lib/date";
import {
  nextTierProgress,
  streakProgressMessage,
  tierForStreak,
  TIER_LABELS,
} from "@/lib/tiers";
import { bossStateForScore, BOSS_STATE_CONFIG } from "@/lib/boss";
import { getMoodForDate } from "@/lib/marcusMood";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { MilestoneBanner } from "@/components/MilestoneBanner";
import { PageBackground } from "@/components/PageBackground";
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

  const mood = getMoodForDate(new Date());

  const unlockedToday =
    (currentStreak === 7 || currentStreak === 14 || currentStreak === 30) &&
    streakRow?.last_completed_date === today;
  const unlockedTierLabel = unlockedToday
    ? TIER_LABELS[tierForStreak(currentStreak)]
    : null;

  return (
    <PageBackground>
        {unlockedTierLabel && (
          <MilestoneBanner
            tierLabel={unlockedTierLabel}
            storageKey={`milestone-dismissed-${user.id}-${currentStreak}-${today}`}
          />
        )}

        <header className="w-full border-b border-white/10">
          <div className="flex items-center justify-between px-6 py-6 sm:px-10 max-w-4xl mx-auto w-full">
            <Logo href="/dashboard" theme="light" />
            <div className="flex items-center gap-6">
              <Link
                href="/history"
                className="text-sm font-bold text-white/60 hover:text-white transition-colors"
              >
                History
              </Link>
              <Link
                href="/feedback"
                className="text-sm font-bold text-white/60 hover:text-white transition-colors"
              >
                Feedback
              </Link>
              <Link
                href="/about"
                className="text-sm font-bold text-white/60 hover:text-white transition-colors"
              >
                About
              </Link>
              <LogoutButton className="text-sm font-bold text-white/60 hover:text-white transition-colors" />
            </div>
          </div>
        </header>

        <div className="border-b border-white/10 px-6 py-5 sm:px-10 mb-8">
          <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-4">
            <p className="text-white font-black text-lg sm:text-xl">
              Good morning, {name}
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:block bg-white rounded-xl shadow-lg px-3 py-1.5">
                <p className="text-xs font-bold text-[#6600FF] whitespace-nowrap">
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
        <div className="bg-white/5 border-[3px] border-white/10 rounded-3xl shadow-lg px-8 py-8 mb-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-8xl leading-none">🔥</span>
            <span className="text-8xl font-black text-orange-400 leading-none">
              {currentStreak}
            </span>
          </div>
          <div className="w-full flex flex-col items-center sm:items-start gap-2">
            <span className="text-xs font-black text-orange-400 uppercase tracking-widest">
              Day streak
            </span>
            <p className="text-white font-bold text-center sm:text-left">
              {streakProgressMessage(currentStreak)}
            </p>
            {progress.nextTier && progress.streakForNextTier !== null && (
              <div className="w-full h-1.5 bg-white/10 border border-white/10 rounded-full overflow-hidden mt-1">
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

        <div className="bg-[#6600FF] rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-widest text-white/60 font-black">
              Today&apos;s mission
            </span>
            <span className="text-xs uppercase tracking-wide text-[#6600FF] font-bold bg-white rounded-full px-3 py-1">
              {scenario.tier}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mb-2">
            {scenario.title}
          </h2>
          <p className="text-sm text-white/60 italic mb-2">
            {mood.emoji} Marcus is {mood.name} today — {mood.description}
          </p>
          <p className="text-sm text-white/60 font-medium mb-4 leading-relaxed">
            {scenario.context}
          </p>
          <div className="bg-[#001220]/40 rounded-xl p-4 mb-6">
            <p className="text-white italic font-medium leading-relaxed">
              <span className="text-2xl font-black text-[#715DF2] align-top mr-1">
                &ldquo;
              </span>
              {scenario.prompt}
              <span className="text-2xl font-black text-[#715DF2] align-top ml-1">
                &rdquo;
              </span>
            </p>
          </div>

          {todayAttempt ? (
            <div className="flex items-center justify-between bg-[#001220]/40 rounded-2xl p-4">
              <div>
                <div className="text-sm font-bold text-white/60">
                  Today&apos;s score
                </div>
                <div className="text-2xl font-black text-white">
                  {(todayAttempt.score as PitchScore | null)?.overall ?? "—"}
                </div>
              </div>
              <div className="text-sm font-bold text-white/60">
                Come back tomorrow 👋
              </div>
            </div>
          ) : (
            <Link
              href="/pitch"
              className="block w-full text-center bg-white hover:bg-[#f2e9ff] text-[#6600FF] font-bold py-4 rounded-full shadow-lg transition-all hover:scale-105"
            >
              Start Recording
            </Link>
          )}
        </div>

        <div>
          <h2 className="text-lg font-black text-white mb-4">
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
                    className="flex items-center justify-between gap-4 bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-4 shadow-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <Image
                        src={bossImage}
                        alt=""
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-white font-bold truncate">
                          {attempt.scenarios?.title ?? "Scenario"}
                        </div>
                        <div className="text-xs font-medium text-white/50 mt-0.5">
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
            <div className="flex items-center gap-4 bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-6 shadow-lg">
              <Image
                src="/boss/boss-dismissive.png"
                alt=""
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/10 shrink-0"
              />
              <p className="text-white/60 font-medium text-sm">
                No battles yet. What are you waiting for?
              </p>
            </div>
          )}
        </div>
        </main>
    </PageBackground>
  );
}
