import { NextResponse } from "next/server";
import { chapter } from "@/lib/bibleService";

/**
 * GET /api/passage?translation=KJV&book=JHN&chapter=3
 * Returns { verses: Verse[] }.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const translation = searchParams.get("translation") ?? "KJV";
  const book = searchParams.get("book") ?? "JHN";
  const chapterNum = parseInt(searchParams.get("chapter") ?? "3", 10);

  if (!Number.isFinite(chapterNum) || chapterNum < 1) {
    return NextResponse.json({ error: "chapter must be a positive integer" }, { status: 400 });
  }

  try {
    const verses = await chapter(translation, book, chapterNum);
    return NextResponse.json({ verses });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
