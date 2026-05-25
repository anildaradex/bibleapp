import "server-only";
import { BundledJSONProvider } from "./providers/bundled";
import { ESVProvider } from "./providers/esv";
import { BollsProvider } from "./providers/bolls";
import type { TranslationProvider } from "./providers/types";
import type { Translation, Verse } from "./types";

const PROVIDERS: TranslationProvider[] = [
  new BundledJSONProvider(
    { id: "KJV", name: "King James Version", publisher: "Public domain (1611)" },
    "KJV"
  ),
  new BundledJSONProvider(
    { id: "BBE", name: "Bible in Basic English", publisher: "Public domain (1949)" },
    "BBE"
  ),
  new ESVProvider(),
  new BollsProvider(
    { id: "NIV", name: "New International Version", publisher: "Biblica / Zondervan (via bolls.life)" },
    "NIV"
  ),
  new BollsProvider(
    { id: "NKJV", name: "New King James Version", publisher: "Thomas Nelson (via bolls.life)" },
    "NKJV"
  ),
  new BundledJSONProvider(
    { id: "TAM", name: "Tamil Bible (TOV)", publisher: "Bible Society of India — Tamil Old Version" },
    "TAM"
  ),
  new BundledJSONProvider(
    { id: "TEL", name: "Telugu Bible (TOV)", publisher: "Bible Society of India — Telugu Old Version" },
    "TEL"
  ),
];

const BY_ID: Record<string, TranslationProvider> =
  Object.fromEntries(PROVIDERS.map(p => [p.translation.id, p]));

export interface TranslationSummary extends Translation {
  available: boolean;
  reason: string | null;
}

export function listTranslations(): TranslationSummary[] {
  return PROVIDERS.map(p => ({
    ...p.translation,
    available: p.isAvailable(),
    reason: p.unavailabilityReason(),
  }));
}

export function getProvider(translationID: string): TranslationProvider | undefined {
  return BY_ID[translationID];
}

export async function chapter(
  translationID: string, bookID: string, chapter: number,
): Promise<Verse[]> {
  const provider = BY_ID[translationID];
  if (!provider) throw new Error(`Translation ${translationID} is not configured`);
  return provider.chapter(bookID, chapter);
}

export async function search(translationID: string, query: string): Promise<Verse[]> {
  const provider = BY_ID[translationID];
  if (!provider) throw new Error(`Translation ${translationID} is not configured`);
  return provider.search(query);
}
