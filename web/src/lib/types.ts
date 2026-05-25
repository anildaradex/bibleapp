export type Testament = "old" | "new";

export interface Book {
  id: string;            // canonical 3-letter code, e.g. "JHN"
  name: string;          // "John"
  testament: Testament;
  chapterCount: number;
}

export interface Translation {
  id: string;            // "KJV", "BBE", "ESV"
  name: string;
  publisher: string;
}

export interface Verse {
  translationID: string;
  bookID: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface PassageReference {
  bookID: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
}

export interface PassageInsight {
  summary: string;
  context: string;
  crossReferences: string[];
  citations: { author: string; sourceURL: string }[];
}
