import type { FillerWordsResult } from "@/lib/types";

const SINGLE_WORD_FILLERS = /^(um+|uh+|like|literally|basically)$/i;

// Used for highlighting filler words inside a rendered transcript string
// (split() keeps the capture group in the output array).
export const FILLER_WORD_PATTERN =
  /\b(um+|uh+|like|you\s+know|literally|basically)\b/gi;

function stripPunctuation(word: string) {
  return word.replace(/[.,!?;:]+$/, "");
}

// AssemblyAI returns transcripts as a flat array of word tokens, so "you
// know" has to be detected across two adjacent tokens rather than as a
// single word match.
export function extractFillerWords(
  words: { text: string }[]
): FillerWordsResult {
  const instances: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const current = stripPunctuation(words[i].text);

    if (SINGLE_WORD_FILLERS.test(current)) {
      instances.push(current);
      continue;
    }

    const next = words[i + 1] ? stripPunctuation(words[i + 1].text) : "";
    if (current.toLowerCase() === "you" && next.toLowerCase() === "know") {
      instances.push(`${current} ${next}`);
      i++;
    }
  }

  return { count: instances.length, instances };
}
