import { FILLER_WORD_PATTERN } from "@/lib/filler-words";

export function HighlightedTranscript({ text }: { text: string }) {
  // Fresh RegExp instance per render — the shared pattern is global and
  // stateful (lastIndex), so reusing it across calls would skip matches.
  const pattern = new RegExp(FILLER_WORD_PATTERN.source, "gi");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="text-danger font-bold">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
