import Anthropic from "@anthropic-ai/sdk";
import type { PitchScore, Scenario } from "@/lib/types";

const client = new Anthropic();

const SCORE_PITCH_TOOL: Anthropic.Tool = {
  name: "score_pitch",
  description:
    "Score a recorded pitch response against the scenario it was responding to and its speech metrics.",
  input_schema: {
    type: "object",
    properties: {
      overall: {
        type: "number",
        description: "Overall score, 0-100, the weighted average of the sub-scores.",
      },
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
    required: [
      "overall",
      "dimensions",
      "filler_penalty",
      "pace_score",
      "feedback",
      "hedging_phrases",
      "strong_moments",
    ],
  },
};

function buildPrompt(params: {
  scenario: Pick<Scenario, "title" | "context" | "prompt">;
  transcript: string;
  fillerCount: number;
  fillerWords: string[];
  wpm: number;
}): string {
  const { scenario, transcript, fillerCount, fillerWords, wpm } = params;

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

SCORING RULES:
- Hook (0-10): Did they grab attention in the first 5 seconds? Leading with name/school/major = 4 or below. Leading with something specific/interesting = 7+
- Clarity (0-10): Is the core message crystal clear? Could a stranger repeat back what they do/want?
- Confidence (0-10): Penalize heavily for: 'I think', 'maybe', 'sort of', 'kind of', 'I guess', 'hopefully', 'I was wondering if'
- Close (0-10): Did they end with a specific ask or clear next step? Trailing off or vague endings = 4 or below
- Filler penalty: 0 fillers = 10, 1-2 = 8, 3-5 = 6, 6-10 = 4, 10+ = 2
- Pace: Under 100 wpm = 5, 100-130 = 7, 130-150 = 10, 150-180 = 7, 180+ = 4
- Overall: weighted average — hook 20%, clarity 25%, confidence 20%, close 20%, filler_penalty 7.5%, pace_score 7.5%
- feedback: 3 specific bullets referencing ACTUAL things they said. Never generic advice. Quote their words when criticizing.
- strong_moments: Always find at least 1 thing they did well, even in a bad pitch. Be specific.
- hedging_phrases: List the actual phrases from their transcript that showed low confidence. Empty array if none.`;
}

export async function scorePitch(params: {
  scenario: Pick<Scenario, "title" | "context" | "prompt">;
  transcript: string;
  fillerCount: number;
  fillerWords: string[];
  wpm: number;
}): Promise<PitchScore> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    tools: [SCORE_PITCH_TOOL],
    tool_choice: { type: "tool", name: "score_pitch" },
    messages: [{ role: "user", content: buildPrompt(params) }],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUse) {
    throw new Error("Claude did not return a score_pitch tool call.");
  }

  const input = toolUse.input as Omit<PitchScore, "filler_words" | "wpm">;

  return {
    ...input,
    filler_words: params.fillerCount,
    wpm: params.wpm,
  };
}
