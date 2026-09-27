import Link from "next/link";
import Image from "next/image";
import { FlameIcon } from "@/components/icons/FlameIcon";
import type { DashboardData } from "./types";

const TIER_MARKERS = [
  { day: 0, label: "Beginner" },
  { day: 7, label: "Intermediate" },
  { day: 14, label: "Advanced" },
  { day: 30, label: "Expert" },
];

// Variant B — "Streak First": the streak is the hero, rendered as a
// progress rail with tier markers instead of a flat number-in-a-box.
// The boss shows up smaller, off to the side, reacting to it.
export function VariantB({ data }: { data: DashboardData }) {
  const { name, currentStreak, scenario, mood, todayAttempt, recentAttempts } =
    data;

  const railPercent = Math.min(100, (currentStreak / 30) * 100);

  return (
    <main className="px-5 pt-6 pb-16">
      <p className="text-sm font-bold text-muted">Hey {name}</p>

      <div className="mt-4 flex items-end gap-3">
        <FlameIcon className="w-9 h-9 text-highlight shrink-0 mb-1" />
        <span className="font-display text-6xl font-bold text-foreground leading-none">
          {currentStreak}
        </span>
        <span className="text-sm font-bold text-muted mb-2">day streak</span>
      </div>

      <div className="relative mt-6 h-1.5 bg-surface rounded-full">
        <div
          className="absolute inset-y-0 left-0 bg-highlight rounded-full"
          style={{ width: `${railPercent}%` }}
        />
        {TIER_MARKERS.map((t) => (
          <div
            key={t.label}
            className="absolute -top-1.5 flex flex-col items-center"
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
            key={t.label}
            className={`text-[10px] font-bold uppercase tracking-wide ${
              currentStreak >= t.day ? "text-foreground" : "text-muted"
            }`}
          >
            {t.label}
          </span>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-3 bg-surface border border-border rounded-2xl p-3 pr-4">
        <Image
          src="/boss/boss-interested.png"
          alt="Marcus"
          width={44}
          height={44}
          className="w-11 h-11 rounded-full object-cover border border-border shrink-0"
        />
        <p className="text-sm text-foreground font-medium italic">
          {mood.emoji} {mood.description}
        </p>
      </div>

      <div className="mt-8">
        <span className="text-xs font-bold text-highlight uppercase tracking-wide">
          Today&apos;s scenario
        </span>
        <h1 className="font-display text-2xl font-bold text-foreground mt-1">
          {scenario.title}
        </h1>
        <p className="mt-3 text-sm text-muted font-medium leading-relaxed">
          {scenario.context}
        </p>
        <div className="mt-4 bg-surface rounded-2xl p-4 shadow-lg">
          <p className="italic text-foreground font-medium leading-relaxed">
            &ldquo;{scenario.prompt}&rdquo;
          </p>
        </div>

        {todayAttempt ? (
          <div className="mt-4 flex items-center justify-between bg-surface rounded-2xl px-5 py-4">
            <div>
              <div className="text-xs font-bold text-muted">Today&apos;s score</div>
              <div className="text-2xl font-black text-foreground">
                {todayAttempt.score?.overall ?? "—"}
              </div>
            </div>
            <span className="text-xs font-bold text-muted">
              Come back tomorrow
            </span>
          </div>
        ) : (
          <Link
            href="/pitch"
            className="mt-4 block w-full text-center bg-accent hover:bg-accent-hover text-foreground font-bold py-4 rounded-full shadow-lg transition-colors"
          >
            Start Recording
          </Link>
        )}
      </div>

      {recentAttempts.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">
            Recent battles
          </p>
          <div className="flex flex-col divide-y divide-border">
            {recentAttempts.map((attempt) => (
              <Link
                key={attempt.id}
                href={`/results?attemptId=${attempt.id}`}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <div className="text-sm font-bold text-foreground truncate max-w-[220px]">
                    {attempt.scenarios?.title ?? "Scenario"}
                  </div>
                  <div className="text-xs text-muted">{attempt.date}</div>
                </div>
                <span className="text-sm font-black text-highlight">
                  {attempt.score?.overall ?? "—"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
