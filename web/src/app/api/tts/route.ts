import { NextResponse } from "next/server";
import { isConfigured, synthesize } from "@/lib/tts/google";

export const runtime = "nodejs";

/**
 * POST /api/tts
 * body: { text: string, lang: "te-IN" | "ta-IN" | "en-US" | ..., rate?: number }
 * → MP3 bytes (Content-Type: audio/mpeg)
 *
 * 501 Not Implemented when GOOGLE_TTS_API_KEY is not set — the client uses
 * this signal to fall back to the browser's Web Speech API.
 */
export async function POST(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Google TTS not configured. Set GOOGLE_TTS_API_KEY in .env.local." },
      { status: 501 },
    );
  }

  let body: { text?: string; lang?: string; rate?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const text = (body.text ?? "").trim();
  const lang = body.lang ?? "en-US";
  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });
  // Google TTS rejects > 5000 bytes per request — guard early.
  if (Buffer.byteLength(text, "utf8") > 4900) {
    return NextResponse.json(
      { error: "text too long; split into chunks under 4900 bytes" },
      { status: 413 },
    );
  }

  try {
    const mp3 = await synthesize({ text, languageCode: lang, rate: body.rate });
    return new Response(new Uint8Array(mp3), {
      headers: {
        "content-type": "audio/mpeg",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/**
 * GET /api/tts → { configured: boolean }
 * Lets the client decide whether to use cloud TTS or fall back to Web Speech.
 */
export async function GET() {
  return NextResponse.json({ configured: isConfigured() });
}
