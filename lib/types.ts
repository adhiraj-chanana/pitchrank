export type Tier = "beginner" | "intermediate" | "advanced" | "expert";

export type Scenario = {
  id: string;
  title: string;
  context: string;
  prompt: string;
  tier: Tier;
  created_at: string;
};

export type DailyScenario = {
  id: string;
  date: string;
  scenario_id: string;
};

export type PitchScore = {
  overall: number;
  placeholder?: boolean;
  filler_words?: number;
  wpm?: number;
  // Week 3: real AI-generated sub-scores and feedback.
  hook?: number;
  clarity?: number;
  confidence?: number;
  close?: number;
  feedback?: string[];
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
