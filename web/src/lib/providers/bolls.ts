import { BOOKS, indexOf } from "../books";
import type { Translation, Verse } from "../types";
import type { TranslationProvider } from "./types";

/**
 * bolls.life — free Bible API with NIV/NKJV (and many others).
 *
 * Endpoints used:
 *   GET https://bolls.life/get-text/<TRANSLATION>/<bookNum>/<chapter>/
 *     → [{ pk, verse, text }, ...]   (text may contain inline <br/> and <i> tags
 *                                      from publisher section headings)
 *   GET https://bolls.life/v2/find/<TRANSLATION>/?search=<q>&match_whole=false
 *     → [{ book, chapter, verse, text }, ...]
 *
 * Book number is the 1-indexed canonical position (Genesis = 1 ... Revelation = 66).
 *
 * No API key required. For personal use only — see the parent project's
 * licensing notes for production deployment.
 */
export class BollsProvider implements TranslationProvider {
  translation: Translation;
  private remoteCode: string;

  constructor(translation: Translation, remoteCode: string) {
    this.translation = translation;
    this.remoteCode = remoteCode;
  }

  isAvailable() { return true; }
  unavailabilityReason() { return null; }

  async chapter(bookID: string, chapter: number): Promise<Verse[]> {
    const bookNum = indexOf(bookID) + 1; // 1-indexed for bolls
    if (bookNum < 1) throw new Error(`Unknown book ${bookID}`);
    const url = `https://bolls.life/get-text/${this.remoteCode}/${bookNum}/${chapter}/`;
    const res = await fetch(url, {
      // Chapters are static — cache aggressively at the edge.
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`bolls.life ${res.status}`);
    const rows = (await res.json()) as { verse: number; text: string }[];
    return rows.map(r => ({
      translationID: this.translation.id,
      bookID,
      chapter,
      verse: r.verse,
      text: cleanHTML(r.text),
    }));
  }

  async search(query: string): Promise<Verse[]> {
    const url = `https://bolls.life/v2/find/${this.remoteCode}/?search=${encodeURIComponent(query)}&match_whole=false`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`bolls.life search ${res.status}`);
    const rows = (await res.json()) as
      { book: number; chapter: number; verse: number; text: string }[];
    return rows.slice(0, 200).flatMap(r => {
      // Bolls book numbers are 1-indexed against canonical order.
      const book = BOOKS[r.book - 1];
      if (!book) return [];
      return [{
        translationID: this.translation.id,
        bookID: book.id,
        chapter: r.chapter,
        verse: r.verse,
        text: cleanHTML(r.text),
      }];
    });
  }
}

function cleanHTML(s: string): string {
  // bolls inserts <br/>Section Title<br/> and the occasional <i>...</i>.
  // Strip all tags; collapse whitespace; trim. We lose section headings —
  // acceptable for v1.
  return s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
