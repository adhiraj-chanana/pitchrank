import Anthropic from "@anthropic-ai/sdk";
import type { PitchDimensions, PitchScore, Scenario } from "@/lib/types";
import type { BossState } from "@/lib/boss";
import type { TokenUsage } from "@/lib/benchmark";

const client = new Anthropic();

// Weights for the overall score, computed in code from dimensions rather
// than asked of the model — see scorePitch for why.
const OVERALL_WEIGHTS = {
  hook: 0.2,
  clarity: 0.25,
  confidence: 0.2,
  close: 0.2,
  filler_penalty: 0.075,
  pace_score: 0.075,
} as const;

// Claude no longer reports `overall` itself — it was asked to do a
// 6-term weighted-average calculation inline while generating six other
// fields, and (confirmed via benchmarks/results, Oct 2026) sometimes just
// didn't include it despite it being in `required` below at the time.
// Computing it in code from the dimension scores is both more reliable
// and removes an entire field Claude has to get right.
const SCORE_PITCH_TOOL: Anthropic.Tool = {
  name: "score_pitch",
  description:
    "Score a recorded pitch response against the scenario it was responding to and its speech metrics.",
  input_schema: {
    type: "object",
    properties: {
      dimensions: {
        type: "object",
        properties: {
          hook: { type: "number", description: "0-10. Did they grab attention in the first 5 seconds?" },
          clarity: { type: "number", description: "0-10. Is the ask or message clear?" },
          confidence: { type: "number", description: "0-10. No hedging language, sounds assured." },
          close: { type: "number", description: "0-10. Did they end with a clear next step or ask?" },
        },
        required: ["hook", "clarity", "confidence", "close"],
      },
      filler_penalty: {
        type: "number",
        description: "0-10 penalty score based on filler word count.",
      },
      pace_score: {
        type: "number",
        description: "0-10. 130-150 wpm is ideal, penalize outside that range.",
      },
      feedback: {
        type: "array",
        items: { type: "string" },
        description: "Exactly 3 specific, actionable bullets referencing actual things they said.",
      },
      hedging_phrases: {
        type: "array",
        items: { type: "string" },
        description: "Actual phrases from the transcript that showed low confidence. Empty array if none.",
      },
      strong_moments: {
        type: "array",
        items: { type: "string" },
        description: "1-2 specific things they did well. Never empty.",
      },
    },
    required: ["dimensions", "filler_penalty", "pace_score", "feedback", "hedging_phrases", "strong_moments"],
  },
};

type RawScorePitchInput = {
  dimensions: PitchDimensions;
  filler_penalty: number;
  pace_score: number;
  feedback: string[];
  hedging_phrases: string[];
  strong_moments: string[];
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

// All dimension fields required, every numeric field validated as an
// actual finite number (not just "present") — this is what replaces the
// silent `overall = 0` fallback: an invalid response now fails loudly
// instead of being coerced into a fake score.
function isValidScorePitchInput(input: unknown): input is RawScorePitchInput {
  if (!input || typeof input !== "object") return false;
  const i = input as Record<string, unknown>;
  const dims = i.dimensions as Record<string, unknown> | undefined;

  if (!dims || typeof dims !== "object") return false;
  if (!isFiniteNumber(dims.hook)) return false;
  if (!isFiniteNumber(dims.clarity)) return false;
  if (!isFiniteNumber(dims.confidence)) return false;
  if (!isFiniteNumber(dims.close)) return false;
  if (!isFiniteNumber(i.filler_penalty)) return false;
  if (!isFiniteNumber(i.pace_score)) return false;
  if (!isStringArray(i.feedback)) return false;
  if (!isStringArray(i.hedging_phrases)) return false;
  if (!isStringArray(i.strong_moments)) return false;

  return true;
}

function computeOverall(input: RawScorePitchInput): number {
  const weighted =
    input.dimensions.hook * OVERALL_WEIGHTS.hook +
    input.dimensions.clarity * OVERALL_WEIGHTS.clarity +
    input.dimensions.confidence * OVERALL_WEIGHTS.confidence +
    input.dimensions.close * OVERALL_WEIGHTS.close +
    input.filler_penalty * OVERALL_WEIGHTS.filler_penalty +
    input.pace_score * OVERALL_WEIGHTS.pace_score;

  return Math.round(weighted * 10);
}

function buildPrompt(params: {
  scenario: Pick<Scenario, "title" | "context" | "prompt">;
  transcript: string;
  fillerCount: number;
  fillerWords: string[];
  wpm: number;
  moodTone: string;
}): string {
  const { scenario, transcript, fillerCount, fillerWords, wpm, moodTone } = params;

  return `You are an expert pitch coach who has trained thousands of professionals on cold pitching, networking, and interviewing.

Score this pitch response to the following scenario:

SCENARIO: ${scenario.title}
CONTEXT: ${scenario.context}
PROMPT THEY RESPONDED TO: ${scenario.prompt}

THEIR RESPONSE:
${transcript}

SPEECH METRICS (from audio analysis):
- Filler words: ${fillerCount} instances (${fillerWords.join(", ")})
- Speaking pace: ${wpm} words per minute (ideal is 130-150 wpm)

Marcus's mood today: ${moodTone}

SCORING RULES:
- Hook (0-10): Did they grab attention in the first 5 seconds? Leading with name/school/major = 4 or below. Leading with something specific/interesting = 7+
- Clarity (0-10): Is the core message crystal clear? Could a stranger repeat back what they do/want?
- Confidence (0-10): Penalize heavily for: 'I think', 'maybe', 'sort of', 'kind of', 'I guess', 'hopefully', 'I was wondering if'
- Close (0-10): Did they end with a specific ask or clear next step? Trailing off or vague endings = 4 or below
- Filler penalty: 0 fillers = 10, 1-2 = 8, 3-5 = 6, 6-10 = 4, 10+ = 2
- Pace: Under 100 wpm = 5, 100-130 = 7, 130-150 = 10, 150-180 = 7, 180+ = 4
- feedback: 3 specific bullets referencing ACTUAL things they said. Never generic advice. Quote their words when criticizing.
- strong_moments: Always find at least 1 thing they did well, even in a bad pitch. Be specific.
- hedging_phrases: List the actual phrases from their transcript that showed low confidence. Empty array if none.`;
}

export async function scorePitch(
  params: {
    scenario: Pick<Scenario, "title" | "context" | "prompt">;
    transcript: string;
    fillerCount: number;
    fillerWords: string[];
    wpm: number;
    moodTone: string;
  },
  // Benchmark-only side channel for token usage — never affects the
  // request, the prompt, or the returned score shape. Omitted in normal
  // production calls. Reflects combined usage across both attempts if a
  // retry happens, since that's the real cost incurred.
  onUsage?: (usage: TokenUsage) => void
): Promise<Omit<PitchScore, "boss_dialogue" | "mood">> {
  let usageTotal: TokenUsage = { inputTokens: 0, outputTokens: 0 };

  async function attempt(): Promise<unknown> {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      tools: [SCORE_PITCH_TOOL],
      tool_choice: { type: "tool", name: "score_pitch" },
      messages: [{ role: "user", content: buildPrompt(params) }],
    });

    usageTotal = {
      inputTokens: usageTotal.inputTokens + message.usage.input_tokens,
      outputTokens: usageTotal.outputTokens + message.usage.output_tokens,
    };

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (!toolUse) {
      console.error(
        `[scorePitch] no tool_use block in response. stop_reason=${message.stop_reason}`
      );
      return undefined;
    }

    if (message.stop_reason === "max_tokens") {
      console.error(
        `[scorePitch] response hit max_tokens — likely truncated. raw=${JSON.stringify(toolUse.input)}`
      );
    }

    return toolUse.input;
  }

  let raw = await attempt();

  if (!isValidScorePitchInput(raw)) {
    console.error(`[scorePitch] invalid tool input, retrying once. raw=${JSON.stringify(raw)}`);
    raw = await attempt();

    if (!isValidScorePitchInput(raw)) {
      console.error(`[scorePitch] invalid tool input after retry. raw=${JSON.stringify(raw)}`);
      onUsage?.(usageTotal);
      throw new Error(
        "Claude returned an invalid score_pitch response twice in a row — see server logs for the raw input."
      );
    }
  }

  onUsage?.(usageTotal);

  return {
    overall: computeOverall(raw),
    dimensions: raw.dimensions,
    filler_penalty: raw.filler_penalty,
    pace_score: raw.pace_score,
    feedback: raw.feedback,
    hedging_phrases: raw.hedging_phrases,
    strong_moments: raw.strong_moments,
    filler_words: params.fillerCount,
    wpm: params.wpm,
  };
}

const BOSS_DIALOGUE_TOOL: Anthropic.Tool = {
  name: "generate_boss_dialogue",
  description:
    "Generate exactly 3 lines of in-character boss dialogue reacting to a pitch.",
  input_schema: {
    type: "object",
    properties: {
      lines: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
        description:
          "Exactly 3 lines. Line 1: very short (2-4 words). Line 2: one sentence. Line 3: one punchy sentence with a clear verdict. No quotes, no stage directions.",
      },
    },
    required: ["lines"],
  },
};

function buildBossDialoguePrompt(params: {
  overall: number;
  state: BossState;
  transcript: string;
  moodTone: string;
}): string {
  const { overall, state, transcript, moodTone } = params;

  return `You are a skeptical VC who just heard this pitch. Score was ${overall}/100. You are ${state}. Write exactly 3 short punchy lines of dialogue reacting to this specific pitch. Reference something they actually said. First line: very short (2-4 words). Second line: one sentence. Third line: one punchy sentence with a clear verdict. No quotes, no stage directions, just the lines.

Your mood today: ${moodTone}

THEIR PITCH:
${transcript}`;
}

export async function generateBossDialogue(
  params: {
    overall: number;
    state: BossState;
    transcript: string;
    moodTone: string;
  },
  // Same benchmark-only side channel as scorePitch's onUsage.
  onUsage?: (usage: TokenUsage) => void
): Promise<string[]> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    tools: [BOSS_DIALOGUE_TOOL],
    tool_choice: { type: "tool", name: "generate_boss_dialogue" },
    messages: [{ role: "user", content: buildBossDialoguePrompt(params) }],
  });

  onUsage?.({
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUse) {
    throw new Error("Claude did not return a generate_boss_dialogue tool call.");
  }

  const { lines } = toolUse.input as { lines: string[] };
  return lines;
}
