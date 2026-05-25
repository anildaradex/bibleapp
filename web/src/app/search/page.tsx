import Link from "next/link";
import type { Metadata } from "next";
import { listTranslations, search } from "@/lib/bibleService";
import { parseReference, BOOKS_BY_ID } from "@/lib/books";
import type { Verse } from "@/lib/types";

export const metadata: Metadata = {
  title: "Search — BibleApp",
  description: "Search Scripture by reference or keyword across KJV, BBE, and ESV.",
};

interface PageProps {
  searchParams: Promise<{ q?: string; t?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "", t = "KJV" } = await searchParams;
  const query = q.trim();
  const translation = t.toUpperCase();
  const translations = listTranslations();

  // If the query parses as a reference, send the user straight to the reader.
  const ref = parseReference(query);
  if (ref) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <SearchForm q={q} t={translation} translations={translations} />
        <div className="mt-6 rounded-lg border border-[var(--border)] p-4">
          <p className="text-sm text-[var(--muted)] mb-2">Looks like a reference:</p>
          <Link
            href={`/read/${ref.bookID}/${ref.chapter}?t=${translation}`}
            className="text-lg font-medium hover:text-[var(--accent)]"
          >
            {BOOKS_BY_ID[ref.bookID]?.name} {ref.chapter}{ref.startVerse > 1 ? `:${ref.startVerse}` : ""}
            {" "}→
          </Link>
        </div>
      </div>
    );
  }

  let results: Verse[] = [];
  let error: string | null = null;
  if (query.length >= 2) {
    try {
      results = await search(translation, query);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Search Scripture</h1>
      <SearchForm q={q} t={translation} translations={translations} />

      {error && <p className="mt-6 text-red-600">{error}</p>}

      {!error && query.length >= 2 && (
        <p className="mt-6 text-sm text-[var(--muted)]">
          {results.length === 0
            ? `No results for “${query}” in ${translation}.`
            : `${results.length} result${results.length === 1 ? "" : "s"} in ${translation}.`}
        </p>
      )}

      <ul className="mt-4 divide-y divide-[var(--border)]">
        {results.map(v => (
          <li key={`${v.bookID}-${v.chapter}-${v.verse}`} className="py-3">
            <Link
              href={`/read/${v.bookID}/${v.chapter}?t=${translation}#v${v.verse}`}
              className="block group"
            >
              <div className="font-ui text-xs text-[var(--muted)] group-hover:text-[var(--accent)]">
                {BOOKS_BY_ID[v.bookID]?.name} {v.chapter}:{v.verse}
              </div>
              <div className="leading-relaxed">{highlight(v.text, query)}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchForm({ q, t, translations }: {
  q: string; t: string;
  translations: { id: string; available: boolean }[];
}) {
  return (
    <form action="/search" className="flex gap-2 font-ui">
      <input
        type="text" name="q" defaultValue={q} autoFocus
        placeholder="Reference (John 3:16) or keyword (love)"
        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5"
      />
      <select name="t" defaultValue={t}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm">
        {translations.map(tr => (
          <option key={tr.id} value={tr.id}>
            {tr.id}{tr.available ? "" : " (setup)"}
          </option>
        ))}
      </select>
      <button type="submit"
              className="rounded-lg bg-[var(--accent)] text-white px-4 py-2.5 text-sm font-medium hover:opacity-90">
        Search
      </button>
    </form>
  );
}

function highlight(text: string, q: string) {
  const trimmed = q.trim();
  if (trimmed.length < 2) return text;
  // Case-insensitive, simple split (no regex special chars accommodated for
  // brevity — fine for verse-text matching).
  const lower = text.toLowerCase();
  const needle = trimmed.toLowerCase();
  const idx = lower.indexOf(needle);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-400/30">{text.slice(idx, idx + needle.length)}</mark>
      {text.slice(idx + needle.length)}
    </>
  );
}
