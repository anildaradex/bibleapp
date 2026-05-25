"use client";

/**
 * Thin wrapper over the browser Web Speech API. Used by the Reader and the
 * Insight drawer so seniors can have passages and AI notes read aloud.
 *
 * Voice quality depends on what the user's OS has installed.
 * - English: every OS ships an English voice.
 * - Telugu (te-IN), Tamil (ta-IN): macOS has them by default; iOS Safari
 *   uses voices from Settings → Accessibility → Spoken Content.
 *   If no voice for the requested lang is found, we fall back to the
 *   default voice; the user may still get useful (mispronounced) output.
 */

export type SpeechStatus = "idle" | "speaking" | "paused";

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

/** Pick the best installed voice for a BCP-47 language tag. */
export function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined") return undefined;
  const voices = window.speechSynthesis.getVoices();
  // Exact match first.
  const exact = voices.find(v => v.lang.toLowerCase() === lang.toLowerCase());
  if (exact) return exact;
  // Same language family (e.g. te-IN ↔ te).
  const base = lang.split("-")[0].toLowerCase();
  return voices.find(v => v.lang.toLowerCase().startsWith(base));
}

interface SpeakOptions {
  text: string;
  lang?: string;
  rate?: number;        // 0.5 .. 2; default 0.9 (slow-ish for seniors)
  onEnd?: () => void;
  onError?: (msg: string) => void;
}

export function speak({ text, lang = "en-US", rate = 0.9, onEnd, onError }: SpeakOptions) {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  synth.cancel(); // any previous utterance
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = rate;
  utter.pitch = 1;
  const voice = pickVoice(lang);
  if (voice) utter.voice = voice;
  utter.onend = () => onEnd?.();
  utter.onerror = (e) => onError?.(e.error || "speech error");
  synth.speak(utter);
}

export function pause() {
  if (typeof window === "undefined") return;
  window.speechSynthesis.pause();
}
export function resume() {
  if (typeof window === "undefined") return;
  window.speechSynthesis.resume();
}
export function stop() {
  if (typeof window === "undefined") return;
  window.speechSynthesis.cancel();
}

/** Returns true once voices have loaded. Voices load asynchronously in
 *  Chrome — call this and re-render when it resolves. */
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
    // Belt-and-braces: timeout so we never hang the UI.
    setTimeout(() => resolve(), 1500);
  });
}
