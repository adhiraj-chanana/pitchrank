// Measures real per-pitch pipeline latency and cost against audio fixtures
// in benchmarks/audio/. Runs the actual transcription/scoring/boss-dialogue
// code (lib/assemblyai.ts, lib/scoring.ts) — same functions production
// uses — but bypasses auth and the daily-limit check entirely by calling
// them directly instead of going through the Next.js API routes, and never
// writes to pitch_attempts or user_streaks.
//
// Run: npm run bench:latency

import "./_load-env";

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import path from "path";
import {
  getTranscript,
  submitTranscription,
  uploadAudioFile,
  type AssemblyAITranscript,
} from "../lib/assemblyai";
import { scorePitch, generateBossDialogue } from "../lib/scoring";
import { extractFillerWords } from "../lib/filler-words";
import { bossStateForScore } from "../lib/boss";
import { getMoodForDate } from "../lib/marcusMood";
import type { TokenUsage } from "../lib/benchmark";

const AUDIO_DIR = path.join(__dirname, "../benchmarks/audio");
const RESULTS_DIR = path.join(__dirname, "../benchmarks/results");
const PRICING_PATH = path.join(__dirname, "../benchmarks/pricing.json");

const RUNS_PER_FILE = 3;
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120_000; // mirrors PitchClient's real timeout

// Fixed, representative scenario — latency doesn't depend meaningfully on
// scenario content, and using a real one would mean a Supabase dependency
// this script doesn't otherwise need.
const BENCHMARK_SCENARIO = {
  title: "Elevator pitch to a skeptical investor",
  context:
    "You have 60 seconds in an elevator with a VC who has heard a thousand pitches today.",
  prompt: "Go ahead, what do you do?",
};

type StepMs = {
  audioUploadMs: number;
  transcribeSubmitMs: number;
  transcribeWaitMs: number;
  scoringCallMs: number;
  bossDialogueCallMs: number;
  totalMs: number;
};

type RunResult = StepMs & {
  file: string;
  run: number;
  audioDurationSeconds: number;
  scoringTokens: TokenUsage;
  bossDialogueTokens: TokenUsage;
};

type Pricing = {
  assemblyai: { universal_pro_per_hour_usd: number };
  anthropic: { haiku_input_per_million_usd: number; haiku_output_per_million_usd: number };
};

async function pollUntilDone(id: string): Promise<AssemblyAITranscript> {
  const start = Date.now();
  while (true) {
    if (Date.now() - start > POLL_TIMEOUT_MS) {
      throw new Error("Transcription timed out.");
    }
    const transcript = await getTranscript(id);
    if (transcript.status === "completed") return transcript;
    if (transcript.status === "error") {
      throw new Error(transcript.error ?? "Transcription failed.");
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

async function runOnce(filePath: string, fileName: string, run: number): Promise<RunResult> {
  const buffer = readFileSync(filePath);

  const t0 = Date.now();
  const uploadUrl = await uploadAudioFile(buffer);
  const audioUploadMs = Date.now() - t0;

  const t1 = Date.now();
  const transcriptId = await submitTranscription(uploadUrl);
  const transcribeSubmitMs = Date.now() - t1;

  const t2 = Date.now();
  const transcript = await pollUntilDone(transcriptId);
  const transcribeWaitMs = Date.now() - t2;

  const words = transcript.words ?? [];
  const audioDurationSeconds = transcript.audio_duration ?? 0;
  const wpm =
    audioDurationSeconds > 0 ? Math.round((words.length / audioDurationSeconds) * 60) : 0;
  const fillerWords = extractFillerWords(words);
  const mood = getMoodForDate(new Date());
  const transcriptText = transcript.text ?? "";

  let scoringTokens: TokenUsage = { inputTokens: 0, outputTokens: 0 };
  const t3 = Date.now();
  const score = await scorePitch(
    {
      scenario: BENCHMARK_SCENARIO,
      transcript: transcriptText,
      fillerCount: fillerWords.count,
      fillerWords: fillerWords.instances,
      wpm,
      moodTone: mood.dialogueTone,
    },
    (usage) => {
      scoringTokens = usage;
    }
  );
  const scoringCallMs = Date.now() - t3;

  // Mirrors production's mood-adjusted overall so the boss-dialogue call
  // sees a realistic state — this is a latency benchmark, not the
  // consistency eval, so there's no reason to diverge from real behavior.
  const moodAdjustedOverall = Math.min(100, Math.max(0, score.overall + mood.scoringModifier));
  const bossState = bossStateForScore(moodAdjustedOverall);

  let bossDialogueTokens: TokenUsage = { inputTokens: 0, outputTokens: 0 };
  const t4 = Date.now();
  await generateBossDialogue(
    {
      overall: moodAdjustedOverall,
      state: bossState,
      transcript: transcriptText,
      moodTone: mood.dialogueTone,
    },
    (usage) => {
      bossDialogueTokens = usage;
    }
  );
  const bossDialogueCallMs = Date.now() - t4;

  const totalMs =
    audioUploadMs + transcribeSubmitMs + transcribeWaitMs + scoringCallMs + bossDialogueCallMs;

  return {
    file: fileName,
    run,
    audioDurationSeconds,
    audioUploadMs,
    transcribeSubmitMs,
    transcribeWaitMs,
    scoringCallMs,
    bossDialogueCallMs,
    totalMs,
    scoringTokens,
    bossDialogueTokens,
  };
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

function average(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

const STEP_KEYS = [
  "audioUploadMs",
  "transcribeSubmitMs",
  "transcribeWaitMs",
  "scoringCallMs",
  "bossDialogueCallMs",
  "totalMs",
] as const;

async function main() {
  mkdirSync(RESULTS_DIR, { recursive: true });

  const files = readdirSync(AUDIO_DIR).filter((f) => !f.startsWith("."));
  if (files.length === 0) {
    console.error(
      `No audio files found in ${AUDIO_DIR}. Add .mp3/.wav/.m4a recordings and re-run.`
    );
    process.exit(1);
  }

  const pricing: Pricing = JSON.parse(readFileSync(PRICING_PATH, "utf-8"));

  const runs: RunResult[] = [];
  for (const file of files) {
    for (let run = 1; run <= RUNS_PER_FILE; run++) {
      console.log(`Running ${file} (${run}/${RUNS_PER_FILE})...`);
      try {
        const result = await runOnce(path.join(AUDIO_DIR, file), file, run);
        runs.push(result);
        console.log(`  total=${result.totalMs}ms`);
      } catch (err) {
        console.error(`  failed: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  if (runs.length === 0) {
    console.error("No successful runs — nothing to summarize.");
    process.exit(1);
  }

  const summary: Record<string, { p50: number; p95: number }> = {};
  for (const key of STEP_KEYS) {
    const values = runs.map((r) => r[key]);
    summary[key] = { p50: percentile(values, 50), p95: percentile(values, 95) };
  }

  const avgAudioHours = average(runs.map((r) => r.audioDurationSeconds)) / 3600;
  const avgInputTokens = average(
    runs.map((r) => r.scoringTokens.inputTokens + r.bossDialogueTokens.inputTokens)
  );
  const avgOutputTokens = average(
    runs.map((r) => r.scoringTokens.outputTokens + r.bossDialogueTokens.outputTokens)
  );

  const transcriptionCostUsd = avgAudioHours * pricing.assemblyai.universal_pro_per_hour_usd;
  const claudeCostUsd =
    (avgInputTokens / 1_000_000) * pricing.anthropic.haiku_input_per_million_usd +
    (avgOutputTokens / 1_000_000) * pricing.anthropic.haiku_output_per_million_usd;
  const estimatedCostPerPitchUsd = transcriptionCostUsd + claudeCostUsd;

  console.log("\n=== Latency summary (ms) ===");
  for (const key of STEP_KEYS) {
    console.log(`${key}: p50=${summary[key].p50} p95=${summary[key].p95}`);
  }
  console.log(`\nEstimated cost per pitch: $${estimatedCostPerPitchUsd.toFixed(4)}`);
  console.log(
    `  transcription: $${transcriptionCostUsd.toFixed(4)}  claude: $${claudeCostUsd.toFixed(4)}`
  );
  console.log(
    "NOTE: pricing.json has placeholder prices — verify them against the current AssemblyAI and Anthropic pricing pages before trusting this estimate."
  );

  const output = {
    generatedAt: new Date().toISOString(),
    runsPerFile: RUNS_PER_FILE,
    files,
    runs,
    summary,
    pricing,
    estimatedCostPerPitchUsd,
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(RESULTS_DIR, `latency-${timestamp}.json`);
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
