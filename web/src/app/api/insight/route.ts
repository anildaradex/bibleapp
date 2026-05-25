import { NextResponse } from "next/server";
import type { PassageInsight, PassageReference, Verse } from "@/lib/types";

/**
 * POST /api/insight
 * body: { reference: PassageReference, verses: Verse[] }
 *
 * Stub for now — mirrors the iOS GemmaService. When the Gemma model is
 * trained and deployed, this route should proxy to that endpoint, hide
 * any auth tokens, and apply the doctrinal-guardrail filter before
 * returning to the client.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    reference: PassageReference;
    verses: Verse[];
  };
  const { reference } = body;

  const insight: PassageInsight = {
    summary: `Summary for ${refDisplay(reference)} will appear here once Gemma is wired up.`,
    context: "Historical and literary context will be sourced from cited commentary entries.",
    crossReferences: [],
    citations: [
      { author: "Precept Austin", sourceURL: "https://www.preceptaustin.org/" },
    ],
  };
  return NextResponse.json(insight);
}

function refDisplay(r: PassageReference): string {
  return r.startVerse === r.endVerse
    ? `${r.bookID} ${r.chapter}:${r.startVerse}`
    : `${r.bookID} ${r.chapter}:${r.startVerse}-${r.endVerse}`;
}
