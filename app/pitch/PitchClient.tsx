"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { HighlightedTranscript } from "@/components/HighlightedTranscript";
import type { Scenario, TranscribeStatusResponse, FillerWordsResult } from "@/lib/types";

const RECORDING_SECONDS = 60;
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;
const WAVEFORM_BAR_COUNT = 40;

type MicStatus = "requesting" | "ready" | "denied" | "unsupported";

type Status =
  | "idle"
  | "recording"
  | "uploading"
  | "transcribing"
  | "transcribed"
  | "submitting"
  | "upload-error"
  | "transcribe-error";

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
];

function getSupportedMimeType(): string {
  for (const type of MIME_CANDIDATES) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

export function PitchClient({ scenario }: { scenario: Scenario }) {
  const router = useRouter();

  const [micStatus, setMicStatus] = useState<MicStatus>("requesting");
  const [status, setStatus] = useState<Status>("idle");
  const [secondsLeft, setSecondsLeft] = useState(RECORDING_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [fillerWords, setFillerWords] = useState<FillerWordsResult | null>(null);
  const [wpm, setWpm] = useState<number | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mimeTypeRef = useRef<string>("");
  const chunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const uploadPathRef = useRef<string>("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    requestMicAccess();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopWaveformLoop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioContextRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function requestMicAccess() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMicStatus("unsupported");
      return;
    }

    setMicStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicStatus("ready");
    } catch {
      setMicStatus("denied");
    }
  }

  function startWaveformLoop(stream: MediaStream) {
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const audioContext = new AudioContextCtor();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
      const canvas = canvasRef.current;
      const currentAnalyser = analyserRef.current;
      if (!canvas || !currentAnalyser) return;

      currentAnalyser.getByteFrequencyData(dataArray);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const step = Math.floor(dataArray.length / WAVEFORM_BAR_COUNT) || 1;
      const barWidth = width / WAVEFORM_BAR_COUNT;

      for (let i = 0; i < WAVEFORM_BAR_COUNT; i++) {
        const value = dataArray[i * step] ?? 0;
        const barHeight = Math.max(4, (value / 255) * height);
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    }

    draw();
  }

  function stopWaveformLoop() {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    analyserRef.current = null;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#262626";
      const barWidth = canvas.width / WAVEFORM_BAR_COUNT;
      for (let i = 0; i < WAVEFORM_BAR_COUNT; i++) {
        ctx.fillRect(i * barWidth, canvas.height / 2 - 2, barWidth - 2, 4);
      }
    }
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;

    const mimeType = getSupportedMimeType();
    mimeTypeRef.current = mimeType;
    chunksRef.current = [];

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: mimeType || "audio/webm",
      });
      audioBlobRef.current = blob;
      stream.getTracks().forEach((t) => t.stop());
      stopWaveformLoop();
      uploadAndTranscribe(blob);
    };

    mediaRecorderRef.current = recorder;
    recorder.start(250);

    setStatus("recording");
    setSecondsLeft(RECORDING_SECONDS);
    startWaveformLoop(stream);

    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          stopRecording();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function stopRecording() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }

  async function pollTranscription(id: string): Promise<TranscribeStatusResponse & { status: "completed" }> {
    const start = Date.now();

    while (true) {
      if (Date.now() - start > POLL_TIMEOUT_MS) {
        throw new Error("Transcription timed out. Please try again.");
      }

      const res = await fetch(`/api/transcribe-status/${id}`);
      if (!res.ok) {
        throw new Error("Failed to check transcription status.");
      }

      const data: TranscribeStatusResponse = await res.json();

      if (data.status === "completed") return data;
      if (data.status === "error") {
        throw new Error(data.error || "Transcription failed, please try again.");
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  async function uploadAndTranscribe(blob: Blob) {
    setError(null);
    setStatus("uploading");

    const supabase = createClient();

    let publicUrl = "";
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated.");

      const ext = (mimeTypeRef.current || blob.type).includes("mp4") ? "mp4" : "webm";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      uploadPathRef.current = path;

      const { error: uploadError } = await supabase.storage
        .from("pitch-recordings")
        .upload(path, blob, { contentType: mimeTypeRef.current || blob.type });
      if (uploadError) throw uploadError;

      publicUrl = supabase.storage.from("pitch-recordings").getPublicUrl(path).data.publicUrl;
    } catch (err) {
      setStatus("upload-error");
      setError(err instanceof Error ? err.message : "Upload failed.");
      return;
    }

    try {
      setStatus("transcribing");

      const startRes = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl: publicUrl }),
      });
      if (!startRes.ok) {
        const body = await startRes.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to start transcription.");
      }
      const { transcript_id } = await startRes.json();

      const result = await pollTranscription(transcript_id);

      if (uploadPathRef.current) {
        await supabase.storage.from("pitch-recordings").remove([uploadPathRef.current]);
      }

      setTranscript(result.text);
      setFillerWords(result.filler_words);
      setWpm(result.words_per_minute);
      setStatus("transcribed");
    } catch (err) {
      setStatus("transcribe-error");
      setError(
        err instanceof Error ? err.message : "Transcription failed, please try again."
      );
    }
  }

  function retryPipeline() {
    if (audioBlobRef.current) {
      uploadAndTranscribe(audioBlobRef.current);
    }
  }

  async function handleFinalSubmit() {
    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch("/api/submit-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          fillerCount: fillerWords?.count ?? 0,
          wpm: wpm ?? 0,
          scenarioId: scenario.id,
        }),
      });

      if (res.status === 409) {
        router.push("/dashboard");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to submit pitch.");
      }

      const { attemptId } = await res.json();
      router.push(`/results?attemptId=${attemptId}`);
    } catch (err) {
      setStatus("transcribed");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="min-h-screen flex flex-col px-6 py-10">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        <div className="mb-10">
          <span className="text-xs uppercase tracking-wide text-muted border border-border rounded-full px-2.5 py-1">
            {scenario.tier}
          </span>
          <h1 className="text-2xl font-bold text-white mt-4">{scenario.title}</h1>
          <p className="text-muted mt-2 leading-relaxed">{scenario.context}</p>
          <p className="text-white italic mt-4 text-lg">&ldquo;{scenario.prompt}&rdquo;</p>
        </div>

        {micStatus === "requesting" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-muted">Requesting microphone access...</p>
          </div>
        )}

        {micStatus === "denied" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center max-w-sm mx-auto">
            <p className="text-white font-semibold">Microphone access needed</p>
            <p className="text-muted text-sm">
              PitchRank needs your microphone to record your pitch. Please allow
              microphone permissions in your browser&apos;s site settings, then
              try again.
            </p>
            <button
              onClick={requestMicAccess}
              className="bg-accent hover:bg-accent-hover text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {micStatus === "unsupported" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center max-w-sm mx-auto">
            <p className="text-white font-semibold">Browser not supported</p>
            <p className="text-muted text-sm">
              Your browser doesn&apos;t support audio recording. Try the latest
              version of Chrome, Safari, or Firefox.
            </p>
          </div>
        )}

        {micStatus === "ready" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            {(status === "recording" || status === "uploading" || status === "transcribing") && (
              <div className="text-6xl font-mono font-bold text-white tabular-nums">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </div>
            )}

            <canvas
              ref={canvasRef}
              width={600}
              height={96}
              className="w-full max-w-md h-24"
            />

            {status === "idle" && (
              <button
                onClick={startRecording}
                className="w-28 h-28 rounded-full bg-accent hover:bg-accent-hover text-white font-semibold flex items-center justify-center transition-colors"
              >
                Record
              </button>
            )}

            {status === "recording" && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-28 h-28 rounded-full bg-red-500 text-white font-semibold flex items-center justify-center animate-pulse-ring">
                  ● Rec
                </div>
                <button
                  onClick={stopRecording}
                  className="bg-surface border border-border hover:border-white/30 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
                >
                  Stop Recording
                </button>
              </div>
            )}

            {status === "uploading" && (
              <p className="text-muted text-lg animate-pulse">Uploading your pitch...</p>
            )}

            {status === "transcribing" && (
              <p className="text-muted text-lg animate-pulse">Transcribing...</p>
            )}

            {(status === "upload-error" || status === "transcribe-error") && (
              <div className="w-full max-w-md flex flex-col items-center gap-4 text-center">
                <p className="text-red-400 text-sm">{error}</p>
                <button
                  onClick={retryPipeline}
                  className="bg-accent hover:bg-accent-hover text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {(status === "transcribed" || status === "submitting") && (
              <div className="w-full flex flex-col items-center gap-6">
                <div className="w-full bg-surface border border-border rounded-xl p-5 text-sm text-white leading-relaxed max-h-64 overflow-y-auto">
                  <HighlightedTranscript text={transcript} />
                </div>

                <div className="flex items-center gap-6 text-sm text-muted">
                  <span>
                    <span className="text-white font-semibold">
                      {fillerWords?.count ?? 0}
                    </span>{" "}
                    filler words
                  </span>
                  <span>
                    <span className="text-white font-semibold">{wpm ?? 0}</span>{" "}
                    words/min
                  </span>
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  onClick={handleFinalSubmit}
                  disabled={status === "submitting"}
                  className="w-full max-w-sm bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  {status === "submitting"
                    ? "The boss is reviewing your pitch..."
                    : "Looks good, score my pitch"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
