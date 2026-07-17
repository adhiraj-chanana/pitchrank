import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { submitTranscription } from "@/lib/assemblyai";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const audioUrl = body.audioUrl;

  if (typeof audioUrl !== "string" || audioUrl.length === 0) {
    return NextResponse.json({ error: "audioUrl is required." }, { status: 400 });
  }

  try {
    const transcriptId = await submitTranscription(audioUrl);
    return NextResponse.json({ transcript_id: transcriptId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
