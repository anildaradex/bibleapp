import type { Book } from "./types";

/**
 * Canonical 66-book table. Mirrors BibleApp/BibleApp/Models/BibleBooks.swift.
 * Order is the canonical Protestant order — used to map bundled JSON
 * (which uses non-standard abbrevs) by array position.
 */
export const BOOKS: Book[] = [
  // Old Testament
  { id: "GEN", name: "Genesis",         testament: "old", chapterCount: 50 },
  { id: "EXO", name: "Exodus",          testament: "old", chapterCount: 40 },
  { id: "LEV", name: "Leviticus",       testament: "old", chapterCount: 27 },
  { id: "NUM", name: "Numbers",         testament: "old", chapterCount: 36 },
  { id: "DEU", name: "Deuteronomy",     testament: "old", chapterCount: 34 },
  { id: "JOS", name: "Joshua",          testament: "old", chapterCount: 24 },
  { id: "JDG", name: "Judges",          testament: "old", chapterCount: 21 },
  { id: "RUT", name: "Ruth",            testament: "old", chapterCount: 4 },
  { id: "1SA", name: "1 Samuel",        testament: "old", chapterCount: 31 },
  { id: "2SA", name: "2 Samuel",        testament: "old", chapterCount: 24 },
  { id: "1KI", name: "1 Kings",         testament: "old", chapterCount: 22 },
  { id: "2KI", name: "2 Kings",         testament: "old", chapterCount: 25 },
  { id: "1CH", name: "1 Chronicles",    testament: "old", chapterCount: 29 },
  { id: "2CH", name: "2 Chronicles",    testament: "old", chapterCount: 36 },
  { id: "EZR", name: "Ezra",            testament: "old", chapterCount: 10 },
  { id: "NEH", name: "Nehemiah",        testament: "old", chapterCount: 13 },
  { id: "EST", name: "Esther",          testament: "old", chapterCount: 10 },
  { id: "JOB", name: "Job",             testament: "old", chapterCount: 42 },
  { id: "PSA", name: "Psalms",          testament: "old", chapterCount: 150 },
  { id: "PRO", name: "Proverbs",        testament: "old", chapterCount: 31 },
  { id: "ECC", name: "Ecclesiastes",    testament: "old", chapterCount: 12 },
  { id: "SNG", name: "Song of Solomon", testament: "old", chapterCount: 8 },
  { id: "ISA", name: "Isaiah",          testament: "old", chapterCount: 66 },
  { id: "JER", name: "Jeremiah",        testament: "old", chapterCount: 52 },
  { id: "LAM", name: "Lamentations",    testament: "old", chapterCount: 5 },
  { id: "EZK", name: "Ezekiel",         testament: "old", chapterCount: 48 },
  { id: "DAN", name: "Daniel",          testament: "old", chapterCount: 12 },
  { id: "HOS", name: "Hosea",           testament: "old", chapterCount: 14 },
  { id: "JOL", name: "Joel",            testament: "old", chapterCount: 3 },
  { id: "AMO", name: "Amos",            testament: "old", chapterCount: 9 },
  { id: "OBA", name: "Obadiah",         testament: "old", chapterCount: 1 },
  { id: "JON", name: "Jonah",           testament: "old", chapterCount: 4 },
  { id: "MIC", name: "Micah",           testament: "old", chapterCount: 7 },
  { id: "NAM", name: "Nahum",           testament: "old", chapterCount: 3 },
  { id: "HAB", name: "Habakkuk",        testament: "old", chapterCount: 3 },
  { id: "ZEP", name: "Zephaniah",       testament: "old", chapterCount: 3 },
  { id: "HAG", name: "Haggai",          testament: "old", chapterCount: 2 },
  { id: "ZEC", name: "Zechariah",       testament: "old", chapterCount: 14 },
  { id: "MAL", name: "Malachi",         testament: "old", chapterCount: 4 },

  // New Testament
  { id: "MAT", name: "Matthew",         testament: "new", chapterCount: 28 },
  { id: "MRK", name: "Mark",            testament: "new", chapterCount: 16 },
  { id: "LUK", name: "Luke",            testament: "new", chapterCount: 24 },
  { id: "JHN", name: "John",            testament: "new", chapterCount: 21 },
  { id: "ACT", name: "Acts",            testament: "new", chapterCount: 28 },
  { id: "ROM", name: "Romans",          testament: "new", chapterCount: 16 },
  { id: "1CO", name: "1 Corinthians",   testament: "new", chapterCount: 16 },
  { id: "2CO", name: "2 Corinthians",   testament: "new", chapterCount: 13 },
  { id: "GAL", name: "Galatians",       testament: "new", chapterCount: 6 },
  { id: "EPH", name: "Ephesians",       testament: "new", chapterCount: 6 },
  { id: "PHP", name: "Philippians",     testament: "new", chapterCount: 4 },
  { id: "COL", name: "Colossians",      testament: "new", chapterCount: 4 },
  { id: "1TH", name: "1 Thessalonians", testament: "new", chapterCount: 5 },
  { id: "2TH", name: "2 Thessalonians", testament: "new", chapterCount: 3 },
  { id: "1TI", name: "1 Timothy",       testament: "new", chapterCount: 6 },
  { id: "2TI", name: "2 Timothy",       testament: "new", chapterCount: 4 },
  { id: "TIT", name: "Titus",           testament: "new", chapterCount: 3 },
  { id: "PHM", name: "Philemon",        testament: "new", chapterCount: 1 },
  { id: "HEB", name: "Hebrews",         testament: "new", chapterCount: 13 },
  { id: "JAS", name: "James",           testament: "new", chapterCount: 5 },
  { id: "1PE", name: "1 Peter",         testament: "new", chapterCount: 5 },
  { id: "2PE", name: "2 Peter",         testament: "new", chapterCount: 3 },
  { id: "1JN", name: "1 John",          testament: "new", chapterCount: 5 },
  { id: "2JN", name: "2 John",          testament: "new", chapterCount: 1 },
  { id: "3JN", name: "3 John",          testament: "new", chapterCount: 1 },
  { id: "JUD", name: "Jude",            testament: "new", chapterCount: 1 },
  { id: "REV", name: "Revelation",      testament: "new", chapterCount: 22 },
];

export const BOOKS_BY_ID: Record<string, Book> =
  Object.fromEntries(BOOKS.map(b => [b.id, b]));

export function indexOf(bookID: string): number {
  return BOOKS.findIndex(b => b.id === bookID);
}

const NAME_LOOKUP: Record<string, string> =
  Object.fromEntries(BOOKS.map(b => [b.name.toLowerCase(), b.id]));

/** "John 3:16", "1 John 2:1-3", "John 3" → PassageReference-ish or null. */
export function parseReference(raw: string): {
  bookID: string; chapter: number; startVerse: number; endVerse: number;
} | null {
  const s = raw.trim();
  const m = /^(.+?)\s+(\d+)(?::(\d+)(?:[-–](\d+))?)?$/.exec(s);
  if (!m) return null;
  const bookID = NAME_LOOKUP[m[1].toLowerCase()];
  if (!bookID) return null;
  const chapter = parseInt(m[2], 10);
  const start = m[3] ? parseInt(m[3], 10) : 1;
  const end = m[4] ? parseInt(m[4], 10) : start;
  return { bookID, chapter, startVerse: start, endVerse: end };
}
