"use client";

import { useEffect, useState } from "react";
import { speak, stop, pause, resume, whenVoicesReady, type SpeechStatus } from "@/lib/speech";

interface Props {
  /** What to read aloud. Build it once per click. */
  getText: () => string;
  lang: string;
  /** Tailwind class overrides if you want a different size */
  className?: string;
  label?: string;
}

/**
 * Big, senior-friendly play/pause/stop button. Shows clear status text
 * and stops automatically when the user navigates away (cleanup on unmount).
 */
export function SpeakButton({ getText, lang, className = "", label = "Listen" }: Props) {
  const [status, setStatus] = useState<SpeechStatus>("idle");

  useEffect(() => {
    whenVoicesReady();
    return () => stop(); // stop speech when component unmounts (nav, drawer close)
  }, []);

  function onPlay() {
    const text = getText().trim();
    if (!text) return;
    setStatus("speaking");
    speak({
      text, lang,
      onEnd: () => setStatus("idle"),
      onError: () => setStatus("idle"),
    });
  }

  function onPause() {
    pause();
    setStatus("paused");
  }
  function onResume() {
    resume();
    setStatus("speaking");
  }
  function onStop() {
    stop();
    setStatus("idle");
  }

  return (
    <div className={`font-ui inline-flex items-center gap-2 ${className}`}>
      {status === "idle" && (
        <button onClick={onPlay} aria-label={`${label}: play`}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] text-white px-4 py-2 hover:opacity-90">
          <span aria-hidden>▶</span><span>{label}</span>
        </button>
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
    </div>
  );
}
