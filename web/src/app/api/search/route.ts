import { NextResponse } from "next/server";
import { search } from "@/lib/bibleService";

/** GET /api/search?translation=KJV&q=love */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const translation = searchParams.get("translation") ?? "KJV";
  const q = searchParams.get("q") ?? "";

  if (q.trim().length < 2) {
    return NextResponse.json({ verses: [] });
  }

  try {
    const verses = await search(translation, q);
    return NextResponse.json({ verses });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
