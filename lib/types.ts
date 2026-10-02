export type Tier = "beginner" | "intermediate" | "advanced" | "expert";

export type Milestone = 7 | 14 | 30;

// A scenario category, e.g. "Elevator Pitch" — orthogonal to Tier (which is
// difficulty). A stable `slug` is the code-facing identifier; `name` is the
// display label.
export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
};

export type Scenario = {
  id: string;
  title: string;
  context: string;
  prompt: string;
  tier: Tier;
  category_id: string;
  created_at: string;
};

export type DailyScenario = {
  id: string;
  date: string;
  category_id: string;
  scenario_id: string;
};

export type PitchDimensions = {
  hook: number;
  clarity: number;
  confidence: number;
  close: number;
};

export type PitchScore = {
  overall: number;
  dimensions: PitchDimensions;
  filler_penalty: number;
  pace_score: number;
  feedback: string[];
  hedging_phrases: string[];
  strong_moments: string[];
  filler_words: number;
  wpm: number;
  boss_dialogue: string[];
  mood: { name: string; emoji: string };
};

export type FillerWordsResult = {
  count: number;
  instances: string[];
};

export type TranscribeStatusResponse =
  | { status: "processing" }
  | { status: "error"; error?: string }
  | {
      status: "completed";
      text: string;
      words_per_minute: number;
      filler_words: FillerWordsResult;
      // Additive, benchmark-only field — forwarded to /api/submit-pitch
      // so its BENCHMARK_LOGGING log line can report it. Unused otherwise.
      audio_duration_seconds: number;
    };

export type PitchAttempt = {
  id: string;
  user_id: string;
  scenario_id: string;
  date: string;
  transcript: string | null;
  score: PitchScore | null;
  audio_url: string | null;
  created_at: string;
};

export type UserStreak = {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
};
