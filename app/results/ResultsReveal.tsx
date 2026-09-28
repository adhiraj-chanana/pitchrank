"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BossReaction } from "@/components/BossReaction";
import { ScoreBar } from "@/components/ScoreBar";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { HighlightedTranscript } from "@/components/HighlightedTranscript";
import { PageBackground } from "@/components/PageBackground";
import type { PitchScore } from "@/lib/types";

// Score count-up duration — bars start right after it finishes, so the
// two stay visually sequential instead of racing each other.
const SCORE_COUNT_MS = 700;
const BAR_STAGGER_MS = 80;

function overallScoreColor(overall: number): string {
  if (overall < 50) return "text-danger";
  if (overall < 75) return "text-warning";
  return "text-success";
}

function scoreVerdict(overall: number): string {
  if (overall < 50) return "The boss was not impressed.";
  if (overall < 75) return "You got his attention. Barely.";
  return "Now THAT'S how you pitch.";
}

function fillerColor(count: number): string {
  if (count === 0) return "text-success";
  if (count <= 3) return "text-warning";
  return "text-danger";
}

function wpmColor(wpm: number): string {
  if (wpm < 100) return "text-danger";
  if (wpm < 130) return "text-warning";
  if (wpm <= 150) return "text-success";
  return "text-warning";
}

export function ResultsReveal({
  scenarioTitle,
  score,
  transcript,
  streakCount,
  isFirstEver = false,
}: {
  scenarioTitle: string;
  score: PitchScore;
  transcript: string;
  streakCount: number;
  isFirstEver?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const [barsStarted, setBarsStarted] = useState(false);

  useEffect(() => {
    if (!revealed) return;
    const t = setTimeout(() => setBarsStarted(true), SCORE_COUNT_MS);
    return () => clearTimeout(t);
  }, [revealed]);

  return (
    <PageBackground contentClassName="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <p className="text-center text-sm font-bold text-muted mb-2">
          {scenarioTitle} <span className="text-muted font-normal mx-1">→</span>
          <span className="text-highlight">Verdict</span>
        </p>

        <h1 className="font-display text-4xl font-bold text-center text-foreground mb-2">
          The verdict is in.
        </h1>
        <p className="text-center text-xs text-muted mb-4">
          {score.mood.emoji} Marcus was {score.mood.name} today
        </p>
        <div className="flex justify-center mb-6">
          <div className="w-24 h-1 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full animate-grow-bar"
              style={{ "--target-width": "100%" } as React.CSSProperties}
            />
          </div>
        </div>

        <BossReaction
          score={score.overall}
          feedback={score.feedback}
          dialogue={score.boss_dialogue}
          onSequenceComplete={() => setRevealed(true)}
        />

        <div
          className={`transition-all duration-700 ease-out ${
            revealed
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <div className="text-center py-4">
            <AnimatedNumber
              value={score.overall}
              start={revealed}
              durationMs={SCORE_COUNT_MS}
              className={`text-9xl font-black leading-none ${overallScoreColor(
                score.overall
              )}`}
            />
            <div className="text-muted font-bold mt-2 uppercase tracking-wide text-sm">
              Out of 100
            </div>
            <p className="text-foreground font-bold text-lg mt-4">
              {scoreVerdict(score.overall)}
            </p>
          </div>

          <div className="mt-10 border-t border-border pt-6 mb-6">
            <h2 className="font-display text-xl font-bold text-foreground mb-1">
              The breakdown
            </h2>
            <p className="text-sm text-muted font-medium mb-5">
              How Marcus scored each part
            </p>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
              <ScoreBar
                variant="dark"
                label="Hook"
                value={score.dimensions.hook}
                start={barsStarted}
                delayMs={0 * BAR_STAGGER_MS}
              />
              <ScoreBar
                variant="dark"
                label="Clarity"
                value={score.dimensions.clarity}
                start={barsStarted}
                delayMs={1 * BAR_STAGGER_MS}
              />
              <ScoreBar
                variant="dark"
                label="Confidence"
                value={score.dimensions.confidence}
                start={barsStarted}
                delayMs={2 * BAR_STAGGER_MS}
              />
              <ScoreBar
                variant="dark"
                label="Close"
                value={score.dimensions.close}
                start={barsStarted}
                delayMs={3 * BAR_STAGGER_MS}
              />
              <ScoreBar
                variant="dark"
                label="Filler"
                value={score.filler_penalty}
                start={barsStarted}
                delayMs={4 * BAR_STAGGER_MS}
              />
              <ScoreBar
                variant="dark"
                label="Pace"
                value={score.pace_score}
                start={barsStarted}
                delayMs={5 * BAR_STAGGER_MS}
              />
            </div>
          </div>

          <div className="flex items-center gap-8 border-t border-border pt-6 mb-6">
            <div>
              <div
                className={`text-4xl font-black ${fillerColor(
                  score.filler_words
                )}`}
              >
                {score.filler_words}
              </div>
              <div className="text-xs font-bold text-muted mt-1 uppercase tracking-wide">
                Filler words
              </div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <div className={`text-4xl font-black ${wpmColor(score.wpm)}`}>
                {score.wpm}
              </div>
              <div className="text-xs font-bold text-muted mt-1 uppercase tracking-wide">
                Words per minute
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-black text-foreground mb-3 uppercase tracking-wide">
              What the boss noticed
            </h2>
            <div className="flex flex-col divide-y divide-border border-t border-b border-border">
              {score.feedback.map((point, i) => (
                <div key={i} className="flex items-start gap-3 py-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-accent text-foreground text-xs font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground font-medium">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-black text-foreground mb-3 uppercase tracking-wide">
              What worked
            </h2>
            <div className="flex flex-col divide-y divide-border border-t border-b border-border">
              {score.strong_moments.map((point, i) => (
                <div key={i} className="flex items-start gap-3 py-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-success/20 text-success text-xs font-black flex items-center justify-center">
                    ✓
                  </span>
                  <p className="text-sm text-foreground font-medium">{point}</p>
                </div>
              ))}
            </div>
          </div>

          {score.hedging_phrases.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-black text-foreground mb-3 uppercase tracking-wide">
                Words to eliminate
              </h2>
              <div className="flex flex-wrap gap-2">
                {score.hedging_phrases.map((phrase, i) => (
                  <span
                    key={i}
                    className="bg-danger/15 text-danger text-sm font-bold px-4 py-2 rounded-full"
                  >
                    &ldquo;{phrase}&rdquo;
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-surface border-2 border-border rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-sm font-black text-foreground mb-3 uppercase tracking-wide">
              Transcript
            </h2>
            <p className="text-sm text-muted font-medium leading-relaxed whitespace-pre-wrap">
              <HighlightedTranscript text={transcript} />
            </p>
          </div>

          {isFirstEver && (
            <div className="mb-6 text-center">
              <p className="font-display text-2xl font-bold text-highlight">
                Day 1 done.
              </p>
              <p className="mt-1 text-sm text-muted font-medium">
                That&apos;s the hardest pitch of the streak. It&apos;s the
                only one you had to start cold.
              </p>
            </div>
          )}

          <div className="border-t-2 border-highlight pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-foreground font-bold text-lg">
                Come back tomorrow for a new scenario.
              </p>
              <p className="text-muted font-medium mt-1 text-sm">
                {streakCount} day{streakCount === 1 ? "" : "s"} streak. Don&apos;t
                break it.
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="shrink-0"
            >
              <Link
                href="/dashboard?justCompleted=1"
                className="block text-center bg-accent hover:bg-accent-hover text-foreground font-bold px-8 py-3.5 rounded-full shadow-lg transition-colors"
              >
                Back to Dashboard
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </PageBackground>
  );
}
