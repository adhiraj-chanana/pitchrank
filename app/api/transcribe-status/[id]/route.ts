import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTranscript } from "@/lib/assemblyai";
import { extractFillerWords } from "@/lib/filler-words";
import type { TranscribeStatusResponse } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const transcript = await getTranscript(params.id);

    if (transcript.status === "error") {
      const body: TranscribeStatusResponse = {
        status: "error",
        error: transcript.error ?? "Transcription failed.",
      };
      return NextResponse.json(body);
    }

    if (transcript.status !== "completed") {
      const body: TranscribeStatusResponse = { status: "processing" };
      return NextResponse.json(body);
    }

    const words = transcript.words ?? [];
    const durationSeconds = transcript.audio_duration ?? 0;
    const wordsPerMinute =
      durationSeconds > 0
        ? Math.round((words.length / durationSeconds) * 60)
        : 0;

    const body: TranscribeStatusResponse = {
      status: "completed",
      text: transcript.text ?? "",
      words_per_minute: wordsPerMinute,
      filler_words: extractFillerWords(words),
      audio_duration_seconds: durationSeconds,
    };
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const body: TranscribeStatusResponse = { status: "error", error: message };
    return NextResponse.json(body, { status: 502 });
  }
}
