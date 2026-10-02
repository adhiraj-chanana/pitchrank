# PitchRank benchmarks

Measurement tooling only. Nothing here changes scoring, streak, or category
logic, and no benchmark run writes to `pitch_attempts` or `user_streaks`.

## Setup

Requires the same `.env.local` the app already uses, plus `ANTHROPIC_API_KEY`
(see `.env.local.example`). The scripts load it themselves via `dotenv` — you
don't need to `export` anything by hand.

## 1. Production instrumentation (`BENCHMARK_LOGGING`)

Set `BENCHMARK_LOGGING=true` in whatever environment is handling real pitch
submissions (e.g. `.env.local` for local testing) and every successful
`/api/submit-pitch` call emits one `[BENCHMARK] {...}` JSON line to the
server log — ms per phase, Claude token usage, audio duration. Grep server
logs for `[BENCHMARK]` to pull these out. Unset or `false` by default: zero
output, zero overhead.

## 2. Latency benchmark

**Add inputs:** drop real pitch recordings (`.mp3`, `.wav`, `.m4a`, whatever
AssemblyAI accepts) into `benchmarks/audio/`. A handful of varied-length
clips (short/medium/long) gives a more useful p50/p95 spread than one file.

**Run:**

```bash
npm run bench:latency
```

Runs the real transcription → scoring → boss-dialogue pipeline 3 times per
file, skipping auth and the daily limit (it calls the pipeline functions
directly, not through the app's API routes). Prints p50/p95 per phase and an
estimated cost per pitch, and saves the full run to
`benchmarks/results/latency-<timestamp>.json`.

**Before trusting the cost estimate:** `benchmarks/pricing.json` ships with
placeholder prices. Verify them against the current
[AssemblyAI pricing page](https://www.assemblyai.com/pricing) and
[Anthropic pricing page](https://www.anthropic.com/pricing) and update the
file — the script re-reads it on every run, no code change needed.

## 3. Scoring consistency eval

**Add inputs:** create one `.txt` file per transcript in
`benchmarks/transcripts/`. Line 1 is a scenario UUID that exists in the
`scenarios` table; everything after that is the transcript text. Example:

```
3f29a1c2-....-....-....-............
So, um, I'm a student at... okay here's the thing, I built an app that...
```

**Run:**

```bash
npm run eval:consistency
```

Scores each transcript 10 times with the real scoring function (mood
modifier disabled, wpm held fixed — see the comments at the top of
`scripts/eval-consistency.ts` for exactly what that means) and prints
mean/stddev/range of the overall score per transcript plus overall
averages. Saves to `benchmarks/results/consistency-<timestamp>.json`.

## 4. Comparing two runs

```bash
npm run compare:results -- benchmarks/results/<before>.json benchmarks/results/<after>.json
```

Works for either latency or consistency result files (detected
automatically) — both files must be the same kind. Prints a before/after
table with deltas.

## Notes

- `benchmarks/audio/`, `benchmarks/transcripts/`, and `benchmarks/results/`
  are gitignored except for `.gitkeep` — your recordings, transcripts, and
  run results stay local.
- Both scripts call the exact same `lib/scoring.ts` / `lib/assemblyai.ts`
  functions the real app uses. Nothing is reimplemented or mocked.
