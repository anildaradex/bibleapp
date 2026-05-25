import type { Metadata } from "next";
import { BOOKS_BY_ID } from "@/lib/books";
import { chapter as fetchChapter, getProvider } from "@/lib/bibleService";
import { Reader } from "@/components/Reader";

interface PageProps {
  params: Promise<{ book: string; chapter: string }>;
  searchParams: Promise<{ t?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { book, chapter } = await params;
  const { t } = await searchParams;
  const translation = (t ?? "KJV").toUpperCase();
  const b = BOOKS_BY_ID[book.toUpperCase()];
  const title = b ? `${b.name} ${chapter} (${translation}) — BibleApp` : "Read — BibleApp";
  return {
    title,
    description: `Read ${b?.name ?? book} ${chapter} in ${translation}.`,
  };
}

export default async function ReaderPage({ params, searchParams }: PageProps) {
  const { book, chapter } = await params;
  const { t } = await searchParams;

  const translationID = (t ?? "KJV").toUpperCase();
  const bookID = book.toUpperCase();
  const chapterNum = parseInt(chapter, 10);

  // If the provider is unavailable (e.g. ESV with no key), don't even try.
  const provider = getProvider(translationID);
  if (provider && !provider.isAvailable()) {
    return (
      <Reader
        translationID={translationID}
        bookID={bookID}
        chapter={chapterNum}
        verses={[]}
        unavailable={{
          name: provider.translation.name,
          reason: provider.unavailabilityReason() ?? "Translation is not configured.",
        }}
      />
    );
  }

  try {
    const verses = await fetchChapter(translationID, bookID, chapterNum);
    return (
      <Reader translationID={translationID} bookID={bookID} chapter={chapterNum} verses={verses} />
    );
  } catch (err) {
    return (
      <Reader
        translationID={translationID}
        bookID={bookID}
        chapter={chapterNum}
        verses={[]}
        errorMessage={err instanceof Error ? err.message : String(err)}
      />
    );
  }
}

/**
 * Static-generate a small set of high-value chapters at build time so the
 * landing-page → reader hop is instant. Everything else renders on demand.
 */
export async function generateStaticParams() {
  const seeds = [
    ["JHN", "3"], ["JHN", "1"], ["JHN", "14"],
    ["GEN", "1"], ["PSA", "23"], ["PSA", "1"],
    ["ROM", "8"], ["MAT", "5"], ["1CO", "13"],
  ];
  // Limit to translations we know don't need keys, so static gen is offline-safe.
  return seeds.map(([book, chapter]) => ({ book, chapter }));
}

// Allow params not in generateStaticParams to render on demand.
export const dynamicParams = true;
