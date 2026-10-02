// Prints a before/after table from two benchmark result JSON files —
// works with either bench-latency.ts or eval-consistency.ts output
// (detected automatically).
//
// Run: npx tsx scripts/compare-results.ts <before.json> <after.json>

import { readFileSync } from "fs";

type LatencyResult = {
  summary: Record<string, { p50: number; p95: number }>;
  estimatedCostPerPitchUsd: number;
};

type ConsistencyResult = {
  overall: { meanOfMeans: number; meanStddev: number; meanRange: number };
};

function loadResult(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

function isLatencyResult(data: unknown): data is LatencyResult {
  return !!data && typeof data === "object" && "summary" in data;
}

function isConsistencyResult(data: unknown): data is ConsistencyResult {
  return !!data && typeof data === "object" && "overall" in data;
}

function formatRow(label: string, before: number, after: number, unit = ""): string {
  const delta = after - before;
  const pct = before !== 0 ? (delta / before) * 100 : 0;
  const arrow = delta > 0 ? "▲" : delta < 0 ? "▼" : "=";
  const sign = delta >= 0 ? "+" : "";
  return (
    `${label.padEnd(24)} ${before.toFixed(2).padStart(10)}${unit}  ` +
    `${after.toFixed(2).padStart(10)}${unit}  ${arrow} ${sign}${delta.toFixed(2)}${unit} ` +
    `(${sign}${pct.toFixed(1)}%)`
  );
}

function main() {
  const [beforePath, afterPath] = process.argv.slice(2);
  if (!beforePath || !afterPath) {
    console.error("Usage: npx tsx scripts/compare-results.ts <before.json> <after.json>");
    process.exit(1);
  }

  const before = loadResult(beforePath);
  const after = loadResult(afterPath);

  if (isLatencyResult(before) && isLatencyResult(after)) {
    console.log(`Comparing latency results\n  before: ${beforePath}\n  after:  ${afterPath}\n`);
    for (const step of Object.keys(before.summary)) {
      const afterStep = after.summary[step];
      if (!afterStep) continue;
      console.log(formatRow(`${step} (p50)`, before.summary[step].p50, afterStep.p50, "ms"));
    }
    console.log();
    console.log(
      formatRow("est. cost/pitch", before.estimatedCostPerPitchUsd, after.estimatedCostPerPitchUsd, " USD")
    );
    return;
  }

  if (isConsistencyResult(before) && isConsistencyResult(after)) {
    console.log(`Comparing consistency results\n  before: ${beforePath}\n  after:  ${afterPath}\n`);
    console.log(formatRow("avg mean score", before.overall.meanOfMeans, after.overall.meanOfMeans));
    console.log(formatRow("avg stddev", before.overall.meanStddev, after.overall.meanStddev));
    console.log(formatRow("avg range", before.overall.meanRange, after.overall.meanRange));
    return;
  }

  console.error(
    "Could not compare — both files must be the same kind of result (both latency-*.json or both consistency-*.json)."
  );
  process.exit(1);
}

main();
