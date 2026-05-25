import { NextResponse } from "next/server";
import { listTranslations } from "@/lib/bibleService";

/** GET /api/translations → { translations: TranslationSummary[] } */
export async function GET() {
  return NextResponse.json({ translations: listTranslations() });
}
