import Link from "next/link";
import Image from "next/image";
import { FlameIcon } from "@/components/icons/FlameIcon";
import type { DashboardData } from "./types";

// Variant C — "Editorial Split": typographic, left-aligned, ruled
// dividers instead of boxed cards. The boss floats as a pull-image next
// to the scenario headline rather than sitting in its own card.
export function VariantC({ data }: { data: DashboardData }) {
  const { name, currentStreak, progress, scenario, mood, todayAttempt, recentAttempts } =
    data;

  return (
    <main className="px-5 pt-6 pb-16 max-w-xl mx-auto">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <p className="text-sm font-bold text-muted">Hey {name}</p>
        <div className="flex items-center gap-1.5">
          <FlameIcon className="w-4 h-4 text-highlight" />
          <span className="text-sm font-bold text-foreground">
            Day {currentStreak}
          </span>
          <span className="text-sm text-muted">
            &middot; {progress.currentTier}
          </span>
        </div>
      </div>

      <div className="mt-6 float-right ml-4 mb-2 w-28">
        <Image
          src="/boss/boss-impressed.png"
          alt="Marcus"
          width={112}
          height={112}
          className="w-28 h-28 rounded-full object-cover border-2 border-border"
        />
        <p className="mt-2 text-xs italic text-muted leading-snug">
          {mood.emoji} &ldquo;{mood.description}&rdquo;
        </p>
      </div>

      <span className="text-xs font-bold text-highlight uppercase tracking-wide">
        Today&apos;s scenario
      </span>
      <h1 className="font-display text-3xl font-bold text-foreground leading-tight mt-1">
        {scenario.title}
      </h1>

      <p className="mt-4 text-foreground font-medium leading-relaxed">
        {scenario.context}
      </p>

      <p className="mt-4 text-2xl font-display text-highlight leading-none">
        &ldquo;
      </p>
      <p className="-mt-4 italic text-foreground font-medium leading-relaxed text-lg">
        {scenario.prompt}
      </p>

      <div className="clear-both" />

      {todayAttempt ? (
        <div className="mt-8 flex items-center justify-between border-t border-b border-border py-4">
          <div>
            <div className="text-xs font-bold text-muted">Today&apos;s score</div>
            <div className="text-2xl font-black text-foreground">
              {todayAttempt.score?.overall ?? "—"}
            </div>
          </div>
          <span className="text-xs font-bold text-muted">Come back tomorrow</span>
        </div>
      ) : (
        <Link
          href="/pitch"
          className="mt-8 inline-block bg-accent hover:bg-accent-hover text-foreground font-bold px-8 py-3.5 rounded-full shadow-lg transition-colors"
        >
          Start Recording
        </Link>
      )}

      {recentAttempts.length > 0 && (
        <div className="mt-10">
          <p className="text-xs font-bold text-muted uppercase tracking-wide border-b border-border pb-2 mb-1">
            Recent battles
          </p>
          {recentAttempts.map((attempt, i) => (
            <Link
              key={attempt.id}
              href={`/results?attemptId=${attempt.id}`}
              className="flex items-center gap-4 py-3 border-b border-border"
            >
              <span className="text-xs font-bold text-muted w-4">
                {i + 1}
              </span>
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
          ))}
        </div>
      )}
    </main>
  );
}
