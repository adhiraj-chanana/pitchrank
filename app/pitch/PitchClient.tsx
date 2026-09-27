"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { HighlightedTranscript } from "@/components/HighlightedTranscript";
import { MicIcon } from "@/components/Logo";
import { StreakCelebration } from "@/components/StreakCelebration";
import { PageBackground } from "@/components/PageBackground";
import type {
  Scenario,
  TranscribeStatusResponse,
  FillerWordsResult,
  Milestone,
} from "@/lib/types";

const RECORDING_SECONDS = 60;
const POLL_INTERVAL_MS = 2000;
// universal-3-5-pro (higher-accuracy, slower tier) can take well over 30s to
// process a full 60s recording — that ceiling was only safe for the short
// test clips used early on, not real pitch-length audio.
const POLL_TIMEOUT_MS = 120000;
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
  | "transcribe-error"
  | "recorder-error"
  | "already-submitted";

const MIME_CANDIDATES = [
  "audio/mp4", // iOS Safari
  "audio/aac", // iOS fallback
  "audio/webm;codecs=opus", // Chrome
  "audio/webm", // Chrome fallback
  "audio/ogg;codecs=opus", // Firefox
  "", // browser default
];

function getSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  return (
    MIME_CANDIDATES.find(
      (type) => type === "" || MediaRecorder.isTypeSupported(type)
    ) ?? ""
  );
}

function getFileExtension(mimeType: string): string {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("aac")) return "aac";
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  return "audio";
}

export function PitchClient({
  scenario,
  isFirstRun = false,
}: {
  scenario: Scenario;
  isFirstRun?: boolean;
}) {
  const router = useRouter();

  const [showIntro, setShowIntro] = useState(isFirstRun);
  const [micStatus, setMicStatus] = useState<MicStatus>("requesting");
  const [status, setStatus] = useState<Status>("idle");
  const [secondsLeft, setSecondsLeft] = useState(RECORDING_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [fillerWords, setFillerWords] = useState<FillerWordsResult | null>(null);
  const [wpm, setWpm] = useState<number | null>(null);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [pendingAttemptId, setPendingAttemptId] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mimeTypeRef = useRef<string>("");
  const chunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const uploadPathRef = useRef<string>("");
  const transcriptIdRef = useRef<string>("");

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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          channelCount: 1,
        },
      });
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
        ctx.fillStyle = "#F4EEE3";
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
      ctx.fillStyle = "#9C2B3C";
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
    chunksRef.current = [];

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      setStatus("recorder-error");
      setError(
        "Your browser may not support recording. Please try Chrome on desktop for the best experience."
      );
      return;
    }

    // recorder.mimeType reflects what the browser actually chose, which is
    // more reliable than our requested mimeType when it fell back to "".
    mimeTypeRef.current = recorder.mimeType || mimeType;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: mimeTypeRef.current || "audio/mp4",
      });
      audioBlobRef.current = blob;
      stream.getTracks().forEach((t) => t.stop());
      stopWaveformLoop();
      uploadAndTranscribe(blob);
    };

    mediaRecorderRef.current = recorder;
    // iOS requires a timeslice for MediaRecorder to actually flush chunks.
    recorder.start(1000);

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

      const ext = getFileExtension(mimeTypeRef.current || blob.type);
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
      transcriptIdRef.current = transcript_id;

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
          transcriptId: transcriptIdRef.current,
          transcript,
          fillerCount: fillerWords?.count ?? 0,
          fillerWords: fillerWords?.instances ?? [],
          wpm: wpm ?? 0,
          scenarioId: scenario.id,
        }),
      });

      if (res.status === 409) {
        setStatus("already-submitted");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to submit pitch.");
      }

      const { attemptId, milestone: newMilestone } = await res.json();

      if (newMilestone) {
        setPendingAttemptId(attemptId);
        setMilestone(newMilestone);
        return;
      }

      router.push(`/results?attemptId=${attemptId}`);
    } catch (err) {
      setStatus("transcribed");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  function handleCelebrationDismiss() {
    setMilestone(null);
    if (pendingAttemptId) {
      router.push(`/results?attemptId=${pendingAttemptId}`);
    }
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <PageBackground contentClassName="min-h-screen text-foreground flex flex-col px-6 py-10">
      {milestone && (
        <StreakCelebration
          milestone={milestone}
          onDismiss={handleCelebrationDismiss}
        />
      )}
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        <div className="bg-surface border border-border rounded-2xl shadow-lg p-6 mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-widest text-muted font-black">
              You&apos;re being judged on:
            </span>
            <span className="text-xs uppercase tracking-wide text-muted font-bold border border-border rounded-full px-3 py-1">
              {scenario.tier}
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">{scenario.title}</h1>
          <p className="text-muted font-medium mt-2 text-sm leading-relaxed">
            {scenario.context}
          </p>
          <p className="text-muted italic font-medium mt-4 text-lg">
            &ldquo;{scenario.prompt}&rdquo;
          </p>
        </div>

        {showIntro && (
          <div className="border border-border rounded-2xl px-5 py-4 mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-foreground mb-1.5">
                What to expect
              </p>
              <ul className="text-sm text-muted font-medium leading-relaxed space-y-1">
                <li>60 seconds. No script, no do-overs.</li>
                <li>Marcus reacts to the specific words you use.</li>
                <li>One pitch counts per day, so take your time before you tap record.</li>
              </ul>
            </div>
            <button
              onClick={() => setShowIntro(false)}
              aria-label="Dismiss"
              className="shrink-0 -m-2.5 px-3.5 py-2.5 text-muted hover:text-foreground font-bold text-sm"
            >
              Got it
            </button>
          </div>
        )}

        {micStatus === "requesting" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-muted font-medium">
              Requesting microphone access...
            </p>
          </div>
        )}

        {micStatus === "denied" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center max-w-sm mx-auto">
            <p className="text-foreground font-black text-lg">Microphone access needed</p>
            <p className="text-muted font-medium text-sm">
              PitchRank needs your microphone to record your pitch. Please allow
              microphone permissions in your browser&apos;s site settings, then
              try again.
            </p>
            <p className="text-muted font-medium text-sm">
              On iPhone, go to Settings → Safari → Microphone and make sure
              it&apos;s enabled.
            </p>
            <motion.button
              onClick={requestMicAccess}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="bg-accent hover:bg-accent-hover text-foreground font-bold px-6 py-3 rounded-full shadow-lg transition-colors"
            >
              Try again
            </motion.button>
          </div>
        )}

        {micStatus === "unsupported" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center max-w-sm mx-auto">
            <p className="text-foreground font-black text-lg">Browser not supported</p>
            <p className="text-muted font-medium text-sm">
              Your browser doesn&apos;t support audio recording. Try the latest
              version of Chrome, Safari, or Firefox.
            </p>
          </div>
        )}

        {micStatus === "ready" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            {status === "recording" && (
              <span className="bg-danger text-foreground text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full animate-pulse">
                ● Recording
              </span>
            )}

            {status === "recording" && (
              <div className="text-8xl font-black text-foreground tabular-nums">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </div>
            )}

            {status === "recording" && (
              <div className="relative flex items-center justify-center w-72 h-72">
                <div className="absolute inset-0 rounded-full bg-accent/20 animate-pulse pointer-events-none" />
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={96}
                  className="relative w-full max-w-md h-24"
                />
              </div>
            )}

            {status === "idle" && (
              <motion.button
                onClick={startRecording}
                className="flex flex-col items-center gap-4 group"
                whileHover="hover"
                initial="rest"
              >
                <motion.span
                  variants={{ rest: { scale: 1 }, hover: { scale: 1.05 } }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="w-40 h-40 rounded-full bg-surface border-4 border-border flex items-center justify-center shadow-lg group-hover:border-accent transition-colors"
                >
                  <MicIcon className="w-24 h-24 text-accent" />
                </motion.span>
                <span className="text-foreground font-bold text-lg">Tap to start</span>
              </motion.button>
            )}

            {status === "recorder-error" && (
              <div className="w-full max-w-md flex flex-col items-center gap-4 text-center">
                <p className="text-danger font-bold text-sm">{error}</p>
                <motion.button
                  onClick={() => {
                    setError(null);
                    setStatus("idle");
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="bg-accent hover:bg-accent-hover text-foreground font-bold px-6 py-3 rounded-full shadow-lg transition-colors"
                >
                  Try again
                </motion.button>
              </div>
            )}

            {status === "already-submitted" && (
              <div className="w-full max-w-sm flex flex-col items-center gap-4 text-center">
                <Image
                  src="/boss/boss-dismissive.png"
                  alt="Marcus"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover border-2 border-border"
                />
                <p className="text-foreground font-bold">
                  You already pitched today.
                </p>
                <p className="text-muted font-medium text-sm">
                  One pitch a day. Come back tomorrow for a new scenario.
                </p>
                <motion.button
                  onClick={() => router.push("/dashboard")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="bg-accent hover:bg-accent-hover text-foreground font-bold px-6 py-3 rounded-full shadow-lg transition-colors"
                >
                  Back to Dashboard
                </motion.button>
              </div>
            )}

            {status === "recording" && (
              <motion.button
                onClick={stopRecording}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="bg-foreground hover:bg-accent-soft text-background font-black text-lg px-8 py-4 rounded-full shadow-lg transition-colors"
              >
                Stop Recording
              </motion.button>
            )}

            {status === "uploading" && (
              <div className="bg-surface border border-border rounded-2xl shadow-lg px-8 py-6 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full border-4 border-border border-t-white animate-spin shrink-0" />
                <Image
                  src="/boss/boss-interested.png"
                  alt="The boss, waiting"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <p className="text-foreground font-medium">Uploading your pitch...</p>
              </div>
            )}

            {status === "transcribing" && (
              <div className="bg-surface border border-border rounded-2xl shadow-lg px-8 py-6 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full border-4 border-border border-t-white animate-spin shrink-0" />
                <Image
                  src="/boss/boss-interested.png"
                  alt="The boss, waiting"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <p className="text-foreground font-medium">Transcribing...</p>
              </div>
            )}

            {status === "submitting" && (
              <div className="bg-surface border border-border rounded-2xl shadow-lg px-8 py-6 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full border-4 border-border border-t-white animate-spin shrink-0" />
                <Image
                  src="/boss/boss-attentive.png"
                  alt="The boss, reviewing your pitch"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <p className="text-foreground font-medium">
                  The boss is reviewing your pitch...
                </p>
              </div>
            )}

            {(status === "upload-error" || status === "transcribe-error") && (
              <div className="w-full max-w-md flex flex-col items-center gap-4 text-center">
                <p className="text-danger font-bold text-sm">{error}</p>
                <motion.button
                  onClick={retryPipeline}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="bg-accent hover:bg-accent-hover text-foreground font-bold px-6 py-3 rounded-full shadow-lg transition-colors"
                >
                  Retry
                </motion.button>
              </div>
            )}

            {status === "transcribed" && (
              <div className="w-full flex flex-col items-center gap-6">
                <div className="w-full bg-surface border border-border rounded-2xl shadow-lg p-5 text-sm text-foreground font-medium leading-relaxed max-h-64 overflow-y-auto">
                  <HighlightedTranscript text={transcript} />
                </div>

                <div className="flex items-center gap-3">
                  <span className="bg-warning/20 text-warning text-sm font-bold px-4 py-1.5 rounded-full">
                    {fillerWords?.count ?? 0} filler words
                  </span>
                  <span className="bg-accent/20 text-highlight text-sm font-bold px-4 py-1.5 rounded-full">
                    {wpm ?? 0} words/min
                  </span>
                </div>

                {error && <p className="text-sm font-bold text-danger">{error}</p>}

                <motion.button
                  onClick={handleFinalSubmit}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="w-full max-w-sm bg-foreground hover:bg-accent-soft text-background font-black py-4 rounded-full shadow-lg transition-colors"
                >
                  Looks good, score my pitch
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>
    </PageBackground>
  );
}
