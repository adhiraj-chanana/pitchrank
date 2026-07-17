import type { PitchScore } from "@/lib/types";

// Real Claude-based scoring lands in week 3. For now every submission gets
// a fixed overall score, but carries the real filler/WPM data from
// AssemblyAI so the UI has something genuine to show.
export function buildPlaceholderScore(params: {
  fillerWords: number;
  wpm: number;
}): PitchScore {
  return {
    overall: 74,
    placeholder: true,
    filler_words: params.fillerWords,
    wpm: params.wpm,
  };
}
