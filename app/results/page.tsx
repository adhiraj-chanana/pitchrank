import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/date";
import { HighlightedTranscript } from "@/components/HighlightedTranscript";
import { ScoreBar } from "@/components/ScoreBar";
import type { PitchScore } from "@/lib/types";

function overallScoreColor(overall: number): string {
  if (overall < 50) return "text-red-400";
  if (overall < 75) return "text-amber-400";
  return "text-green-400";
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ attemptId?: string }>;
}) {
  const { attemptId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const query = supabase
    .from("pitch_attempts")
    .select("*, scenarios(title)")
    .eq("user_id", user.id);

  const { data: attempt } = attemptId
    ? await query.eq("id", attemptId).maybeSingle()
    : await query.eq("date", todayDateString()).maybeSingle();

  if (!attempt) {
    redirect("/pitch");
  }

  const { data: streakRow } = await supabase
    .from("user_streaks")
    .select("current_streak")
    .eq("user_id", user.id)
    .maybeSingle();

  const score = attempt.score as PitchScore;
  const transcript = attempt.transcript ?? "";

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-xl mx-auto">
        <p className="text-center text-muted text-sm mb-2">
          {(attempt as unknown as { scenarios: { title: string } | null })
            .scenarios?.title ?? "Today's pitch"}
        </p>
        <div className="text-center mb-10">
          <div
            className={`text-7xl font-bold leading-none ${overallScoreColor(
              score.overall
            )}`}
          >
            {score.overall}
          </div>
          <div className="text-muted mt-2">Overall score</div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 mb-6 flex flex-col gap-5">
          <ScoreBar label="Hook" value={score.dimensions.hook} />
          <ScoreBar label="Clarity" value={score.dimensions.clarity} />
          <ScoreBar label="Confidence" value={score.dimensions.confidence} />
          <ScoreBar label="Close" value={score.dimensions.close} />
          <ScoreBar label="Filler" value={score.filler_penalty} />
          <ScoreBar label="Pace" value={score.pace_score} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-surface border border-border rounded-2xl p-5 text-center">
            <div className="text-2xl font-bold text-white">
              {score.filler_words}
            </div>
            <div className="text-xs text-muted mt-1">Filler words</div>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-5 text-center">
            <div className="text-2xl font-bold text-white">{score.wpm}</div>
            <div className="text-xs text-muted mt-1">Words per minute</div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-3">Feedback</h2>
          <ul className="flex flex-col gap-2">
            {score.feedback.map((point, i) => (
              <li key={i} className="text-sm text-muted flex gap-2">
                <span className="text-accent">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-3">
            Strong moments
          </h2>
          <ul className="flex flex-col gap-2">
            {score.strong_moments.map((point, i) => (
              <li key={i} className="text-sm text-muted flex gap-2">
                <span className="text-green-400">✓</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {score.hedging_phrases.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-white mb-3">
              Hedging phrases
            </h2>
            <ul className="flex flex-col gap-2">
              {score.hedging_phrases.map((phrase, i) => (
                <li key={i} className="text-sm text-red-400">
                  &ldquo;{phrase}&rdquo;
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-3">Transcript</h2>
          <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
            <HighlightedTranscript text={transcript} />
          </p>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-surface to-background border border-border rounded-2xl p-6 mb-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-black border border-border flex items-center justify-center text-2xl shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
            🕴️
          </div>
          <p className="text-sm text-muted italic">
            The boss is watching. Come back tomorrow to face a new scenario.
          </p>
        </div>

        <div className="text-center mb-8">
          <p className="text-white">
            🔥 Streak updated —{" "}
            <span className="font-bold">
              {streakRow?.current_streak ?? 1} day
              {(streakRow?.current_streak ?? 1) === 1 ? "" : "s"}
            </span>
          </p>
        </div>

        <Link
          href="/dashboard"
          className="block w-full text-center bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
