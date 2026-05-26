import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Google Cloud Text-to-Speech — produces dramatically better Telugu /
 * Tamil / English audio than the OS system voices.
 *
 * Auth: API key via `GOOGLE_TTS_API_KEY` env var. Create one at
 * console.cloud.google.com → APIs & Services → Credentials, after enabling
 * the "Cloud Text-to-Speech API" on a billing-enabled project. The free
 * tier (1M chars/month for Wavenet / Neural2 / Chirp3-HD) covers all
 * personal Bible reading.
 *
 * Defaults to Chirp3-HD voices ("HD" line — most natural). Override per
 * language with GOOGLE_TTS_VOICE_<LANG_TAG> env vars, e.g.
 *   GOOGLE_TTS_VOICE_TE_IN=te-IN-Standard-A
 */

interface SynthesizeParams {
  text: string;
  languageCode: string;   // "te-IN", "ta-IN", "en-US"
  rate?: number;          // 0.25 .. 4.0, default 0.92 (gently slow)
}

const DEFAULT_VOICES: Record<string, string> = {
  "te-IN": "te-IN-Chirp3-HD-Achernar",
  "ta-IN": "ta-IN-Chirp3-HD-Achernar",
  "en-US": "en-US-Chirp3-HD-Achernar",
};

const CACHE_DIR = path.join(process.cwd(), ".next", "cache", "tts");

export function isConfigured(): boolean {
  return !!process.env.GOOGLE_TTS_API_KEY;
}

function voiceFor(lang: string): string {
  const envKey = `GOOGLE_TTS_VOICE_${lang.replace("-", "_").toUpperCase()}`;
  return process.env[envKey] ?? DEFAULT_VOICES[lang] ?? DEFAULT_VOICES["en-US"];
}

function cacheKey({ text, languageCode, rate, voice }: SynthesizeParams & { voice: string }) {
  const hash = crypto.createHash("sha256")
    .update(`${languageCode}|${voice}|${rate ?? 0.92}|${text}`)
    .digest("hex");
  return hash.slice(0, 40); // 160 bits — plenty
}

/**
 * Returns MP3 bytes. Cached on disk per (lang, voice, rate, text).
 * Throws if not configured or the API returns an error.
 */
export async function synthesize(params: SynthesizeParams): Promise<Buffer> {
  if (!isConfigured()) throw new Error("GOOGLE_TTS_API_KEY is not set");
  const voice = voiceFor(params.languageCode);
  const key = cacheKey({ ...params, voice });

  await fs.mkdir(CACHE_DIR, { recursive: true });
  const cachePath = path.join(CACHE_DIR, `${key}.mp3`);

  try {
    const cached = await fs.readFile(cachePath);
    return cached;
  } catch { /* cache miss → fetch */ }

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`;
  const body = {
    input: { text: params.text },
    voice: { languageCode: params.languageCode, name: voice },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: params.rate ?? 0.92,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google TTS ${res.status}: ${errText.slice(0, 400)}`);
  }
  const json = (await res.json()) as { audioContent: string };
  const audio = Buffer.from(json.audioContent, "base64");
  await fs.writeFile(cachePath, audio);
  return audio;
}
