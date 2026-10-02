const ASSEMBLYAI_BASE_URL = "https://api.assemblyai.com/v2";

export type AssemblyAIWord = {
  text: string;
  start: number;
  end: number;
  confidence: number;
};

export type AssemblyAITranscript = {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  text: string | null;
  words: AssemblyAIWord[] | null;
  audio_duration: number | null;
  error?: string;
};

function apiKey(): string {
  const key = process.env.ASSEMBLYAI_API_KEY;
  if (!key) {
    throw new Error("ASSEMBLYAI_API_KEY is not configured.");
  }
  return key;
}

// Used only by scripts/bench-latency.ts. Production always uploads via
// Supabase storage (PitchClient.tsx) and passes that public URL instead —
// this exists because benchmark runs have no authenticated user/session
// for storage RLS, and AssemblyAI's own upload endpoint sidesteps that
// entirely while still measuring a real "upload the audio somewhere"
// latency rather than skipping that phase.
export async function uploadAudioFile(buffer: Buffer): Promise<string> {
  const res = await fetch(`${ASSEMBLYAI_BASE_URL}/upload`, {
    method: "POST",
    headers: { Authorization: apiKey() },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AssemblyAI upload failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { upload_url: string };
  return data.upload_url;
}

export async function submitTranscription(audioUrl: string): Promise<string> {
  const res = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript`, {
    method: "POST",
    headers: {
      Authorization: apiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      speech_models: ["universal-3-5-pro", "universal-2"],
      disfluencies: true,
      filter_profanity: false,
      language_detection: false,
      language_code: "en",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AssemblyAI submit failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { id: string };
  return data.id;
}

export async function getTranscript(id: string): Promise<AssemblyAITranscript> {
  const res = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript/${id}`, {
    headers: { Authorization: apiKey() },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AssemblyAI status check failed (${res.status}): ${body}`);
  }

  return res.json();
}
