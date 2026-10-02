// Shared shape for the per-pitch benchmark log line and the gated logger
// that emits it. Used by app/api/submit-pitch/route.ts (real traffic) and
// reused by scripts/bench-latency.ts (synthetic runs) so both produce
// directly comparable records.
//
// Logging only ever happens when BENCHMARK_LOGGING=true — off by default,
// zero cost/output in production otherwise.

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type PitchBenchmarkLogEntry = {
  timestamp: string;
  attemptId: string;
  audioDurationSeconds: number;
  ms: {
    audioUpload: number;
    transcribeSubmit: number;
    transcribeWait: number;
    scoringCall: number;
    bossDialogueCall: number;
    dbWrites: number;
    total: number;
  };
  tokens: {
    scoring: TokenUsage;
    bossDialogue: TokenUsage;
  };
};

export function isBenchmarkLoggingEnabled(): boolean {
  return process.env.BENCHMARK_LOGGING === "true";
}

export function logPitchBenchmark(entry: PitchBenchmarkLogEntry): void {
  if (!isBenchmarkLoggingEnabled()) return;
  // Tagged + single-line JSON so it's trivially grep-able in server logs.
  console.log(`[BENCHMARK] ${JSON.stringify(entry)}`);
}
