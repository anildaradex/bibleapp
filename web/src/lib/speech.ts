"use client";

/**
 * Voice for the Reader & Insight drawer. Tries two backends in order:
 *
 *   1. Cloud TTS (Google Cloud Text-to-Speech via our /api/tts route).
 *      Dramatically better Telugu / Tamil / English voices. Used when
 *      the server has GOOGLE_TTS_API_KEY configured. Audio is MP3,
 *      cached server-side per (text + lang + voice).
 *
 *   2. Web Speech API (browser built-in). Fallback when no cloud key.
 *      Quality varies wildly by OS.
 *
 * The chunker splits long passages on sentence / verse boundaries so
 * the cloud request never exceeds the API's 5KB / request limit.
 */

export type SpeechStatus = "idle" | "loading" | "speaking" | "paused";

export const LANG_FOR_TRANSLATION: Record<string, string> = {
  KJV:  "en-US",
  BBE:  "en-US",
  ESV:  "en-US",
  NIV:  "en-US",
  NKJV: "en-US",
  TAM:  "ta-IN",
  TEL:  "te-IN",
};

export function langForTranslation(translationID: string): string {
  return LANG_FOR_TRANSLATION[translationID] ?? "en-US";
}

// -------------------- Web Speech (fallback) --------------------

export function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined") return undefined;
  const voices = window.speechSynthesis.getVoices();
  const exact = voices.find(v => v.lang.toLowerCase() === lang.toLowerCase());
  if (exact) return exact;
  const base = lang.split("-")[0].toLowerCase();
  return voices.find(v => v.lang.toLowerCase().startsWith(base));
}

export function whenVoicesReady(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const synth = window.speechSynthesis;
  if (synth.getVoices().length > 0) return Promise.resolve();
  return new Promise(resolve => {
    const tick = () => {
      if (synth.getVoices().length > 0) {
        synth.removeEventListener("voiceschanged", tick);
        resolve();
      }
    };
    synth.addEventListener("voiceschanged", tick);
    setTimeout(() => resolve(), 1500);
  });
}

// -------------------- Cloud TTS check --------------------

let cloudConfiguredCache: boolean | null = null;
export async function cloudTTSConfigured(): Promise<boolean> {
  if (cloudConfiguredCache !== null) return cloudConfiguredCache;
  try {
    const res = await fetch("/api/tts");
    if (!res.ok) { cloudConfiguredCache = false; return false; }
    const data = (await res.json()) as { configured: boolean };
    cloudConfiguredCache = !!data.configured;
    return cloudConfiguredCache;
  } catch {
    cloudConfiguredCache = false;
    return false;
  }
}

// -------------------- Chunking --------------------

/**
 * Split text into ≤ 4500-byte chunks on natural breaks (verse/sentence).
 * UTF-8 is variable-width so we measure with `Blob` (or TextEncoder).
 */
export function chunkForCloud(text: string, maxBytes = 4500): string[] {
  const encoder = new TextEncoder();
  const sentences = text.split(/(?<=[.!?।])\s+/); // include Devanagari/Tamil/Telugu danda
  const chunks: string[] = [];
  let current = "";
  for (const s of sentences) {
    const next = current ? `${current} ${s}` : s;
    if (encoder.encode(next).length > maxBytes) {
      if (current) chunks.push(current);
      // If a single sentence is still too long, hard-split it.
      if (encoder.encode(s).length > maxBytes) {
        let remaining = s;
        while (encoder.encode(remaining).length > maxBytes) {
          // Conservative slice — assume 3 bytes/char for Indic scripts.
          const sliceLen = Math.floor(maxBytes / 3);
          chunks.push(remaining.slice(0, sliceLen));
          remaining = remaining.slice(sliceLen);
        }
        current = remaining;
      } else {
        current = s;
      }
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// -------------------- Controller --------------------

interface SpeakOptions {
  text: string;
  lang: string;
  rate?: number;
  onStatus?: (s: SpeechStatus) => void;
  onError?: (msg: string) => void;
}

export class SpeechController {
  private status: SpeechStatus = "idle";
  private audio: HTMLAudioElement | null = null;
  private queue: string[] = [];           // remaining audio object URLs
  private opts: SpeakOptions | null = null;
  private cancelled = false;

  async play(opts: SpeakOptions) {
    this.cancel(); // any previous run
    this.cancelled = false;
    this.opts = opts;

    const text = opts.text.trim();
    if (!text) return;

    const useCloud = await cloudTTSConfigured();
    if (useCloud) {
      this.setStatus("loading");
      try {
        const chunks = chunkForCloud(text);
        const urls: string[] = [];
        for (const c of chunks) {
          if (this.cancelled) return;
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ text: c, lang: opts.lang, rate: opts.rate }),
          });
          if (!res.ok) throw new Error(`/api/tts ${res.status}`);
          const blob = await res.blob();
          urls.push(URL.createObjectURL(blob));
        }
        this.queue = urls;
        if (!this.cancelled) this.playNext();
      } catch (e) {
        opts.onError?.(e instanceof Error ? e.message : String(e));
        // Fall back to Web Speech on cloud failure.
        this.localSpeak(opts);
      }
    } else {
      this.localSpeak(opts);
    }
  }

  private localSpeak(opts: SpeakOptions) {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(opts.text);
    utter.lang = opts.lang;
    utter.rate = opts.rate ?? 0.9;
    utter.pitch = 1;
    const v = pickVoice(opts.lang);
    if (v) utter.voice = v;
    utter.onstart = () => this.setStatus("speaking");
    utter.onend   = () => this.setStatus("idle");
    utter.onerror = e => { opts.onError?.(e.error || "speech error"); this.setStatus("idle"); };
    synth.speak(utter);
  }

  private playNext() {
    const next = this.queue.shift();
    if (!next) { this.setStatus("idle"); return; }
    this.audio = new Audio(next);
    this.audio.onplaying = () => this.setStatus("speaking");
    this.audio.onended = () => {
      URL.revokeObjectURL(next);
      this.audio = null;
      if (!this.cancelled) this.playNext();
    };
    this.audio.onerror = () => {
      this.opts?.onError?.("audio playback error");
      this.setStatus("idle");
    };
    this.audio.play().catch(e => {
      this.opts?.onError?.(String(e));
      this.setStatus("idle");
    });
  }

  pause() {
    if (this.audio) { this.audio.pause(); this.setStatus("paused"); return; }
    if (typeof window !== "undefined") {
      window.speechSynthesis.pause();
      this.setStatus("paused");
    }
  }
  resume() {
    if (this.audio) { this.audio.play(); this.setStatus("speaking"); return; }
    if (typeof window !== "undefined") {
      window.speechSynthesis.resume();
      this.setStatus("speaking");
    }
  }
  cancel() {
    this.cancelled = true;
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio = null;
    }
    for (const u of this.queue) URL.revokeObjectURL(u);
    this.queue = [];
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
    this.setStatus("idle");
  }

  private setStatus(s: SpeechStatus) {
    this.status = s;
    this.opts?.onStatus?.(s);
  }
}
