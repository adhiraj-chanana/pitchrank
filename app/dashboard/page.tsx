import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTodayScenario } from "@/lib/today-scenario";
import { todayDateString } from "@/lib/date";
import { streakProgressMessage, tierForStreak, TIER_LABELS } from "@/lib/tiers";
import { bossStateForScore, BOSS_STATE_CONFIG } from "@/lib/boss";
import { getMoodForDate } from "@/lib/marcusMood";
import { MilestoneBanner } from "@/components/MilestoneBanner";
import { PageBackground } from "@/components/PageBackground";
import { AppHeader } from "@/components/AppHeader";
import { FlameIcon } from "@/components/icons/FlameIcon";
import type { PitchAttempt, PitchScore } from "@/lib/types";

const TIER_MARKERS: { day: number; tier: "beginner" | "intermediate" | "advanced" | "expert" }[] = [
  { day: 0, tier: "beginner" },
  { day: 7, tier: "intermediate" },
  { day: 14, tier: "advanced" },
  { day: 30, tier: "expert" },
];

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

        <AppHeader
          links={[
            { href: "/history", label: "History" },
            { href: "/feedback", label: "Feedback" },
            { href: "/about", label: "About" },
          ]}
        />

        <main className="max-w-2xl mx-auto px-6 pb-20 pt-6">
          <p className="text-sm font-bold text-muted">Hey {name}</p>

          <div className="mt-3 flex items-end gap-3">
            <FlameIcon className="w-9 h-9 text-highlight shrink-0 mb-1" />
            <span className="font-display text-6xl font-bold text-foreground leading-none">
              {currentStreak}
            </span>
            <span className="text-sm font-bold text-muted mb-2">day streak</span>
          </div>
          <p className="mt-2 text-foreground font-bold text-sm">
            {streakProgressMessage(currentStreak)}
          </p>

          <div className="relative mt-6 h-1.5 bg-surface rounded-full">
            <div
              className="absolute inset-y-0 left-0 bg-highlight rounded-full transition-all"
              style={{ width: `${Math.min(100, (currentStreak / 30) * 100)}%` }}
            />
            {TIER_MARKERS.map((t) => (
              <div
                key={t.tier}
                className="absolute -top-1.5"
                style={{ left: `${(t.day / 30) * 100}%` }}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    currentStreak >= t.day
                      ? "bg-highlight border-highlight"
                      : "bg-background border-border"
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3">
            {TIER_MARKERS.map((t) => (
              <span
                key={t.tier}
                className={`text-[10px] font-bold uppercase tracking-wide ${
                  currentStreak >= t.day ? "text-foreground" : "text-muted"
                }`}
              >
                {TIER_LABELS[t.tier]}
              </span>
            ))}
          </div>

          <div className="mt-10 border-t border-border pt-6">
            <div className="float-right ml-4 mb-2 w-24">
              <Image
                src={
                  BOSS_STATE_CONFIG[
                    bossStateForScore(
                      (todayAttempt?.score as PitchScore | null)?.overall ?? 60
                    )
                  ].image
                }
                alt="Marcus"
                width={96}
                height={96}
                className="w-24 h-24 rounded-full object-cover border-2 border-border"
              />
              <p className="mt-2 text-xs italic text-muted leading-snug">
                {mood.emoji} &ldquo;{mood.description}&rdquo;
              </p>
            </div>

            <span className="text-xs font-bold text-highlight uppercase tracking-wide">
              Today&apos;s scenario
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-tight mt-1">
              {scenario.title}
            </h1>
            <p className="mt-3 text-foreground font-medium leading-relaxed text-sm">
              {scenario.context}
            </p>
            <p className="mt-4 italic text-foreground font-medium leading-relaxed border-l-2 border-highlight pl-3">
              &ldquo;{scenario.prompt}&rdquo;
            </p>

            <div className="clear-both" />
          </div>

          {todayAttempt ? (
            <div className="mt-8 flex items-center justify-between border-t border-b border-border py-4">
              <div>
                <div className="text-xs font-bold text-muted">Today&apos;s score</div>
                <div className="text-2xl font-black text-foreground">
                  {(todayAttempt.score as PitchScore | null)?.overall ?? "—"}
                </div>
              </div>
              <span className="text-xs font-bold text-muted">Come back tomorrow</span>
            </div>
          ) : (
            <Link
              href="/pitch"
              className="mt-8 block w-full text-center bg-accent hover:bg-accent-hover text-foreground font-bold py-4 rounded-full shadow-lg transition-colors"
            >
              Start Recording
            </Link>
          )}

          <div className="mt-10">
            <p className="text-xs font-bold text-muted uppercase tracking-wide border-b border-border pb-2 mb-1">
              Recent battles
            </p>
            {recentAttempts && recentAttempts.length > 0 ? (
              (
                recentAttempts as (PitchAttempt & {
                  scenarios: { title: string } | null;
                })[]
              ).map((attempt, i) => (
                <Link
                  key={attempt.id}
                  href={`/results?attemptId=${attempt.id}`}
                  className="flex items-center gap-4 py-3 border-b border-border"
                >
                  <span className="text-xs font-bold text-muted w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-foreground truncate">
                      {attempt.scenarios?.title ?? "Scenario"}
                    </div>
                    <div className="text-xs text-muted">{attempt.date}</div>
                  </div>
                  <span className="text-sm font-black text-highlight">
                    {attempt.score?.overall ?? "—"}
                  </span>
                </Link>
              ))
            ) : (
              <p className="py-4 text-sm text-muted font-medium">
                No battles yet. What are you waiting for?
              </p>
            )}
          </div>
        </main>
    </PageBackground>
  );
}
