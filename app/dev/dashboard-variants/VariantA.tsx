import Link from "next/link";
import Image from "next/image";
import { FlameIcon } from "@/components/icons/FlameIcon";
import type { DashboardData } from "./types";

// Variant A — "Hero Boss": the boss portrait dominates the top of the
// screen, the streak rides as a compact badge pinned over it, and the
// scenario reads as a headline rather than a generic card.
export function VariantA({ data }: { data: DashboardData }) {
  const { name, currentStreak, scenario, mood, todayAttempt, recentAttempts } =
    data;

  return (
    <main className="pb-16">
      <section className="relative px-5 pt-6 pb-10 overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-muted">Hey {name},</p>
            <h1 className="font-display text-2xl font-bold text-foreground mt-0.5">
              Marcus is waiting.
            </h1>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 bg-surface border border-border rounded-full pl-2 pr-3 py-1.5">
            <FlameIcon className="w-4 h-4 text-highlight" />
            <span className="text-sm font-black text-foreground">
              {currentStreak}
            </span>
          </div>
        </div>

        <div className="relative mt-4 -mx-5">
          <Image
            src="/boss-landing.png"
            alt="Marcus, the PitchRank boss"
            width={1371}
            height={1147}
            priority
            className="w-full max-w-[340px] ml-auto h-auto -mb-6"
          />
          <div className="absolute left-5 bottom-2 max-w-[70%]">
            <span className="text-xs font-bold text-highlight uppercase tracking-wide">
              Today&apos;s scenario
            </span>
            <h2 className="font-display text-xl font-bold text-foreground leading-tight mt-1">
              {scenario.title}
            </h2>
          </div>
        </div>
      </section>

      <section className="px-5">
        <div className="border-2 border-border rounded-tl-3xl rounded-br-3xl bg-surface p-5">
          <p className="text-xs font-bold text-muted mb-2">
            {mood.emoji} Marcus is {mood.name.toLowerCase()} today
          </p>
          <p className="text-foreground font-medium leading-relaxed text-sm">
            {scenario.context}
          </p>
          <p className="mt-3 italic text-foreground font-medium leading-relaxed border-l-2 border-highlight pl-3">
            &ldquo;{scenario.prompt}&rdquo;
          </p>
        </div>

        {todayAttempt ? (
          <div className="mt-4 flex items-center justify-between bg-background border border-border rounded-2xl px-5 py-4">
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
      </section>

      {recentAttempts.length > 0 && (
        <section className="mt-8 px-5">
          <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">
            Recent battles
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {recentAttempts.map((attempt) => (
              <Link
                key={attempt.id}
                href={`/results?attemptId=${attempt.id}`}
                className="shrink-0 flex flex-col items-center gap-1.5 w-16"
              >
                <div className="relative w-14 h-14 rounded-full border-2 border-border flex items-center justify-center text-sm font-black text-foreground bg-surface">
                  {attempt.score?.overall ?? "—"}
                </div>
                <span className="text-[10px] text-muted font-medium">
                  {attempt.date.slice(5)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
