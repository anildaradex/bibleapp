import { BOOKS_BY_ID, parseReference } from "../books";
import type { Translation, Verse } from "../types";
import type { TranslationProvider } from "./types";

/**
 * Crossway ESV API. Server-side only — the key (ESV_API_KEY env var)
 * never leaves the server.
 *
 * Free for personal / non-commercial use:
 * https://api.esv.org/account/create-application/
 */
export class ESVProvider implements TranslationProvider {
  translation: Translation = {
    id: "ESV",
    name: "English Standard Version",
    publisher: "Crossway",
  };

  isAvailable() { return !!process.env.ESV_API_KEY; }
  unavailabilityReason() {
    return this.isAvailable()
      ? null
      : "Set ESV_API_KEY in .env.local. Free key at api.esv.org.";
  }

  async chapter(bookID: string, chapter: number): Promise<Verse[]> {
    const book = BOOKS_BY_ID[bookID];
    if (!book) throw new Error(`Unknown book ${bookID}`);
    const passage = await this.fetchPassage(`${book.name} ${chapter}`);
    return this.parse(passage, bookID, chapter);
  }

  async search(query: string): Promise<Verse[]> {
    if (!this.isAvailable()) throw new Error("ESV_API_KEY is not set");
    const url = new URL("https://api.esv.org/v3/passage/search/");
    url.searchParams.set("q", query);
    url.searchParams.set("page-size", "50");
    const res = await fetch(url, {
      headers: { Authorization: `Token ${process.env.ESV_API_KEY}` },
      // Cache search results for 1 hour
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`ESV API ${res.status}: ${await res.text()}`);
    const data = await res.json() as { results: { reference: string; content: string }[] };
    return data.results.flatMap(hit => {
      const ref = parseReference(hit.reference);
      if (!ref) return [];
      return [{
        translationID: this.translation.id,
        bookID: ref.bookID,
        chapter: ref.chapter,
        verse: ref.startVerse,
        text: hit.content.trim(),
      }];
    });
  }

  private async fetchPassage(query: string): Promise<string> {
    if (!this.isAvailable()) throw new Error("ESV_API_KEY is not set");
    const url = new URL("https://api.esv.org/v3/passage/text/");
    const params: Record<string, string> = {
      q: query,
      "include-passage-references": "false",
      "include-verse-numbers": "true",
      "include-footnotes": "false",
      "include-headings": "false",
      "include-short-copyright": "false",
      "include-passage-horizontal-lines": "false",
      "include-heading-horizontal-lines": "false",
      "indent-paragraphs": "0",
      "indent-poetry": "false",
    };
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url, {
      headers: { Authorization: `Token ${process.env.ESV_API_KEY}` },
      // Chapters rarely change — cache for a day.
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`ESV API ${res.status}: ${await res.text()}`);
    const data = await res.json() as { passages: string[] };
    return data.passages.join("\n");
  }

  /** Parses ESV's `[N] text [N+1] text ...` into individual verses. */
  private parse(passage: string, bookID: string, chapter: number): Verse[] {
    const re = /\[(\d+)\]\s*([\s\S]*?)(?=\s*\[\d+\]|$)/g;
    const out: Verse[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(passage)) !== null) {
      out.push({
        translationID: this.translation.id,
        bookID,
        chapter,
        verse: parseInt(m[1], 10),
        text: m[2].trim().replace(/\s+/g, " "),
      });
    }
    return out;
  }
}
