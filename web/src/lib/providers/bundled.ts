import fs from "node:fs/promises";
import path from "node:path";
import { BOOKS, indexOf } from "../books";
import type { Translation, Verse } from "../types";
import type { TranslationProvider } from "./types";

interface RawBook {
  abbrev: string;
  chapters: string[][];
}

const DATA_DIR = path.join(process.cwd(), "data", "bibles");

/**
 * Loads a public-domain translation from data/bibles/<id>.json.
 * Same file format used by the iOS app — array of 66 books in canonical
 * order, each `{ abbrev, chapters: [[v1, v2, ...], ...] }`.
 *
 * Books indexed by ARRAY POSITION against `BOOKS`, since the embedded
 * abbrevs are non-standard.
 */
export class BundledJSONProvider implements TranslationProvider {
  translation: Translation;
  private resourceName: string;
  private cache: RawBook[] | null = null;

  constructor(translation: Translation, resourceName: string) {
    this.translation = translation;
    this.resourceName = resourceName;
  }

  isAvailable() { return true; }
  unavailabilityReason() { return null; }

  private async load(): Promise<RawBook[]> {
    if (this.cache) return this.cache;
    const filePath = path.join(DATA_DIR, `${this.resourceName}.json`);
    const raw = await fs.readFile(filePath, "utf8");
    // Strip UTF-8 BOM if present.
    const cleaned = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
    this.cache = JSON.parse(cleaned) as RawBook[];
    return this.cache;
  }

  async chapter(bookID: string, chapter: number): Promise<Verse[]> {
    const books = await this.load();
    const i = indexOf(bookID);
    if (i < 0 || i >= books.length) {
      throw new Error(`Unknown book ${bookID}`);
    }
    const cIdx = chapter - 1;
    const raw = books[i];
    if (cIdx < 0 || cIdx >= raw.chapters.length) {
      throw new Error(`${bookID} has no chapter ${chapter}`);
    }
    return raw.chapters[cIdx].map((text, vi) => ({
      translationID: this.translation.id,
      bookID,
      chapter,
      verse: vi + 1,
      text,
    }));
  }

  async search(query: string): Promise<Verse[]> {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];
    const books = await this.load();
    const hits: Verse[] = [];
    for (let bi = 0; bi < books.length && bi < BOOKS.length; bi++) {
      const bookID = BOOKS[bi].id;
      const raw = books[bi];
      for (let ci = 0; ci < raw.chapters.length; ci++) {
        const verses = raw.chapters[ci];
        for (let vi = 0; vi < verses.length; vi++) {
          if (verses[vi].toLowerCase().includes(needle)) {
            hits.push({
              translationID: this.translation.id,
              bookID,
              chapter: ci + 1,
              verse: vi + 1,
              text: verses[vi],
            });
            if (hits.length >= 200) return hits;
          }
        }
      }
    }
    return hits;
  }
}
