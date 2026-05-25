import type { Translation, Verse } from "../types";

export interface TranslationProvider {
  translation: Translation;
  isAvailable(): boolean;
  unavailabilityReason(): string | null;
  chapter(bookID: string, chapter: number): Promise<Verse[]>;
  search(query: string): Promise<Verse[]>;
}
