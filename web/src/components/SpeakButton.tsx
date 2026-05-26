"use client";

import { useEffect, useRef, useState } from "react";
import { SpeechController, whenVoicesReady, type SpeechStatus } from "@/lib/speech";

interface Props {
  /** Build the text to read once per click. */
  getText: () => string;
  lang: string;
  className?: string;
  label?: string;
}

/**
 * Big, senior-friendly play / pause / resume / stop button.
 *
 * - Uses Google Cloud TTS when configured server-side (much better
 *   Telugu / Tamil voices), with a "Preparing voice…" indicator while
 *   the first chunk is fetched.
 * - Falls back to the browser's Web Speech API otherwise.
 * - Stops automatically when the component unmounts (drawer close, nav).
 */
export function SpeakButton({ getText, lang, className = "", label = "Listen" }: Props) {
  const controllerRef = useRef<SpeechController | null>(null);
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    whenVoicesReady();
    controllerRef.current = new SpeechController();
    return () => controllerRef.current?.cancel();
  }, []);

  function onPlay() {
    const text = getText().trim();
    if (!text) return;
    setError(null);
    controllerRef.current?.play({
      text, lang,
      onStatus: setStatus,
      onError: (msg) => setError(msg),
    });
  }
  function onPause()  { controllerRef.current?.pause(); }
  function onResume() { controllerRef.current?.resume(); }
  function onStop()   { controllerRef.current?.cancel(); }

  return (
    <div className={`font-ui inline-flex items-center gap-2 flex-wrap ${className}`}>
      {(status === "idle") && (
        <button onClick={onPlay} aria-label={`${label}: play`}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] text-white px-4 py-2 hover:opacity-90">
          <span aria-hidden>▶</span><span>{label}</span>
        </button>
      )}
      {status === "loading" && (
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[var(--muted)]"
              aria-live="polite">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
          Preparing voice…
          <button onClick={onStop} aria-label="Cancel"
                  className="ml-1 text-[var(--muted)] hover:text-[var(--accent)]">✕</button>
        </span>
      )}
      {status === "speaking" && (
        <>
          <button onClick={onPause} aria-label="Pause"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 hover:bg-[var(--background)]">
            <span aria-hidden>⏸</span><span>Pause</span>
          </button>
          <button onClick={onStop} aria-label="Stop"
                  className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 hover:bg-[var(--background)]"
                  title="Stop">
            <span aria-hidden>■</span>
          </button>
        </>
      )}
      {status === "paused" && (
        <>
          <button onClick={onResume} aria-label="Resume"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] text-white px-4 py-2 hover:opacity-90">
            <span aria-hidden>▶</span><span>Resume</span>
          </button>
          <button onClick={onStop} aria-label="Stop"
                  className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 hover:bg-[var(--background)]"
                  title="Stop">
            <span aria-hidden>■</span>
          </button>
        </>
      )}
      {error && (
        <span className="text-xs text-red-600 max-w-xs">{error}</span>
      )}
    </div>
  );
}
