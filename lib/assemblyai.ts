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
