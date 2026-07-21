"use client";

import Link from "next/link";
import { useState } from "react";
import { BossReaction } from "@/components/BossReaction";
import { ScoreBar } from "@/components/ScoreBar";
import { HighlightedTranscript } from "@/components/HighlightedTranscript";
import type { PitchScore } from "@/lib/types";

function overallScoreColor(overall: number): string {
  if (overall < 50) return "text-danger";
  if (overall < 75) return "text-warning";
  return "text-success";
}

function scoreCardClasses(overall: number): string {
  if (overall < 50) return "bg-red-50 border-red-200";
  if (overall < 75) return "bg-amber-50 border-amber-200";
  return "bg-green-50 border-green-200";
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
}: {
  scenarioTitle: string;
  score: PitchScore;
  transcript: string;
  streakCount: number;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f4f6] px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <p className="text-center text-sm font-bold text-muted mb-2">
          {scenarioTitle} <span className="text-gray-400 font-normal mx-1">→</span>
          <span className="text-accent">Verdict</span>
        </p>

        <h1 className="text-4xl font-black text-center text-foreground mb-2">
          The verdict is in.
        </h1>
        <p className="text-center text-xs text-gray-400 mb-4">
          {score.mood.emoji} Marcus was {score.mood.name} today
        </p>
        <div className="flex justify-center mb-6">
          <div className="w-24 h-1 bg-indigo-100 rounded-full overflow-hidden">
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
          <div
            className={`text-center mb-10 rounded-3xl border-2 py-12 px-6 ${scoreCardClasses(
              score.overall
            )}`}
          >
            <div
              className={`text-9xl font-black leading-none ${overallScoreColor(
                score.overall
              )}`}
            >
              {score.overall}
            </div>
            <div className="text-muted font-bold mt-2 uppercase tracking-wide text-sm">
              Out of 100
            </div>
            <p className="text-foreground font-bold text-lg mt-4">
              {scoreVerdict(score.overall)}
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-black text-foreground mb-4">
              The breakdown
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <ScoreBar label="Hook" value={score.dimensions.hook} />
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <ScoreBar label="Clarity" value={score.dimensions.clarity} />
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <ScoreBar
                  label="Confidence"
                  value={score.dimensions.confidence}
                />
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <ScoreBar label="Close" value={score.dimensions.close} />
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <ScoreBar label="Filler" value={score.filler_penalty} />
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <ScoreBar label="Pace" value={score.pace_score} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-surface border-2 border-border rounded-2xl shadow-lg p-6 text-center">
              <div
                className={`text-5xl font-black ${fillerColor(
                  score.filler_words
                )}`}
              >
                {score.filler_words}
              </div>
              <div className="text-xs font-bold text-muted mt-2 uppercase tracking-wide">
                Filler words
              </div>
            </div>
            <div className="bg-surface border-2 border-border rounded-2xl shadow-lg p-6 text-center">
              <div className={`text-5xl font-black ${wpmColor(score.wpm)}`}>
                {score.wpm}
              </div>
              <div className="text-xs font-bold text-muted mt-2 uppercase tracking-wide">
                Words per minute
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-black text-foreground mb-3 uppercase tracking-wide">
              What the boss noticed
            </h2>
            <div className="flex flex-col gap-3">
              {score.feedback.map((point, i) => (
                <div
                  key={i}
                  className="bg-white shadow-sm border-l-4 border-l-accent rounded-xl p-4 flex items-start gap-3"
                >
                  <span className="shrink-0 w-6 h-6 rounded-full bg-accent text-white text-xs font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground font-medium">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-black text-foreground mb-3 uppercase tracking-wide">
              ✅ What worked
            </h2>
            <div className="flex flex-col gap-3">
              {score.strong_moments.map((point, i) => (
                <div
                  key={i}
                  className="bg-green-50 border-l-4 border-l-success shadow-sm rounded-xl p-4"
                >
                  <p className="text-sm text-foreground font-medium">{point}</p>
                </div>
              ))}
            </div>
          </div>

          {score.hedging_phrases.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-black text-foreground mb-3 uppercase tracking-wide">
                ⚠️ Words to eliminate
              </h2>
              <div className="flex flex-wrap gap-2">
                {score.hedging_phrases.map((phrase, i) => (
                  <span
                    key={i}
                    className="bg-red-100 text-red-700 text-sm font-bold px-4 py-2 rounded-full"
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

          <div className="bg-accent rounded-3xl shadow-lg p-8 text-center">
            <p className="text-white font-black text-xl">
              Come back tomorrow for a new scenario
            </p>
            <p className="text-indigo-100 font-bold mt-2">
              🔥 {streakCount} day{streakCount === 1 ? "" : "s"} streak — don&apos;t
              break it
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-block bg-white hover:bg-indigo-50 text-accent font-black px-8 py-3.5 rounded-full shadow-lg transition-all hover:scale-105"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
