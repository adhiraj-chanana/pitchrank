// Measures scoring-model variance: scores each fixture transcript 10 times
// with the real scorePitch function and reports mean/stddev/range of the
// overall score. The mood scoring modifier (production's
// `overall + mood.scoringModifier` step in app/api/submit-pitch/route.ts)
// is never applied here — this calls scorePitch directly, so only Claude's
// own run-to-run variance is being measured, not mood or any other
// post-processing.
//
// Run: npm run eval:consistency

import "./_load-env";

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { scorePitch } from "../lib/scoring";
import { extractFillerWords } from "../lib/filler-words";
import { MOODS } from "../lib/marcusMood";

const TRANSCRIPTS_DIR = path.join(__dirname, "../benchmarks/transcripts");
const RESULTS_DIR = path.join(__dirname, "../benchmarks/results");

const RUNS_PER_TRANSCRIPT = 10;
// These fixtures are plain text with no real audio, so there's no measured
// speaking pace — held at a fixed, scoring-neutral value (the middle of the
// "ideal" 130-150 wpm band) so every run of every transcript sees the exact
// same wpm input, and it can't itself contribute to the variance measured.
const FIXED_WPM = 140;
// Mood modifier disabled per spec: scorePitch never applies a numeric
// adjustment regardless of moodTone (that only happens one level up, in
// submit-pitch's own code, which this script doesn't call). The tone text
// below only shapes the prompt Claude sees, and is held fixed — a neutral,
// non-random mood — so the prompt is identical on every run and on every
// invocation of this script regardless of what day it's run.
const FIXED_MOOD_TONE = MOODS.focused.dialogueTone;

type ScenarioRow = { title: string; context: string; prompt: string };

type FileResult = {
  file: string;
  scenarioId: string;
  runs: number;
  scores: number[];
  mean: number;
  stddev: number;
  range: number;
};

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]): number {
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

function requireSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (.env.local) to look up scenarios by ID."
    );
  }
  // Service role, read-only here (a single scenarios SELECT) — this script
  // never writes to Supabase.
  return createClient(url, key);
}

async function main() {
  mkdirSync(RESULTS_DIR, { recursive: true });

  const files = readdirSync(TRANSCRIPTS_DIR).filter((f) => f.endsWith(".txt"));
  if (files.length === 0) {
    console.error(
      `No transcript files found in ${TRANSCRIPTS_DIR}. Add .txt files (scenario UUID on line 1, transcript text below) and re-run.`
    );
    process.exit(1);
  }

  const supabase = requireSupabaseClient();
  const fileResults: FileResult[] = [];

  for (const file of files) {
    const raw = readFileSync(path.join(TRANSCRIPTS_DIR, file), "utf-8");
    const lines = raw.split("\n");
    const scenarioId = (lines[0] ?? "").trim();
    const transcript = lines.slice(1).join("\n").trim();

    if (!scenarioId || !transcript) {
      console.error(`  ${file}: expected a scenario ID on line 1 and transcript below it, skipping`);
      continue;
    }

    const { data: scenario, error } = await supabase
      .from("scenarios")
      .select("title, context, prompt")
      .eq("id", scenarioId)
      .maybeSingle<ScenarioRow>();

    if (error || !scenario) {
      console.error(`  ${file}: scenario ${scenarioId} not found in scenarios table, skipping`);
      continue;
    }

    const words = transcript.split(/\s+/).filter(Boolean).map((text) => ({ text }));
    const fillerWords = extractFillerWords(words);

    console.log(`Scoring ${file} x${RUNS_PER_TRANSCRIPT}...`);
    const scores: number[] = [];
    for (let run = 1; run <= RUNS_PER_TRANSCRIPT; run++) {
      const score = await scorePitch({
        scenario,
        transcript,
        fillerCount: fillerWords.count,
        fillerWords: fillerWords.instances,
        wpm: FIXED_WPM,
        moodTone: FIXED_MOOD_TONE,
      });
      scores.push(score.overall);
    }

    const m = mean(scores);
    const sd = stddev(scores);
    const range = Math.max(...scores) - Math.min(...scores);

    fileResults.push({
      file,
      scenarioId,
      runs: RUNS_PER_TRANSCRIPT,
      scores,
      mean: m,
      stddev: sd,
      range,
    });
    console.log(`  scores=[${scores.join(", ")}] mean=${m.toFixed(2)} stddev=${sd.toFixed(2)} range=${range}`);
  }

  if (fileResults.length === 0) {
    console.error("No transcripts scored — nothing to summarize.");
    process.exit(1);
  }

  const overall = {
    meanOfMeans: mean(fileResults.map((f) => f.mean)),
    meanStddev: mean(fileResults.map((f) => f.stddev)),
    meanRange: mean(fileResults.map((f) => f.range)),
  };

  console.log("\n=== Overall ===");
  console.log(`avg mean score: ${overall.meanOfMeans.toFixed(2)}`);
  console.log(`avg stddev:     ${overall.meanStddev.toFixed(2)}`);
  console.log(`avg range:      ${overall.meanRange.toFixed(2)}`);

  const output = {
    generatedAt: new Date().toISOString(),
    runsPerTranscript: RUNS_PER_TRANSCRIPT,
    fixedWpm: FIXED_WPM,
    moodModifierDisabled: true,
    files: fileResults,
    overall,
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(RESULTS_DIR, `consistency-${timestamp}.json`);
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
