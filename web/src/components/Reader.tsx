"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BOOKS, BOOKS_BY_ID, indexOf } from "@/lib/books";
import { recordSession } from "@/lib/tracker";
import type { PassageInsight, PassageReference, Verse } from "@/lib/types";

interface Props {
  translationID: string;
  bookID: string;
  chapter: number;
  verses: Verse[];
  /** Provider-level unavailability (e.g. ESV with no key). */
  unavailable?: { name: string; reason: string };
  /** Server-side load error to surface, if any. */
  errorMessage?: string;
}

export function Reader({ translationID, bookID, chapter, verses, unavailable, errorMessage }: Props) {
  const book = BOOKS_BY_ID[bookID];
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [insight, setInsight] = useState<PassageInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  // Track foreground reading time so the Journey meter ticks up when you leave.
  useEffect(() => {
    const start = Date.now();
    return () => {
      const seconds = (Date.now() - start) / 1000;
      // Only credit substantive reads (>= 5s) to avoid bouncing every nav.
      if (seconds >= 5) recordSession(seconds, verses.length);
    };
  }, [bookID, chapter, verses.length]);

  const bookIdx = indexOf(bookID);
  const canPrev = chapter > 1 || bookIdx > 0;
  const canNext = chapter < (book?.chapterCount ?? 0)
                  || bookIdx < BOOKS.length - 1;

  const prevHref = useMemo(() => {
    if (chapter > 1) return `/read/${bookID}/${chapter - 1}?t=${translationID}`;
    if (bookIdx > 0) {
      const prev = BOOKS[bookIdx - 1];
      return `/read/${prev.id}/${prev.chapterCount}?t=${translationID}`;
    }
    return "#";
  }, [bookID, chapter, bookIdx, translationID]);

  const nextHref = useMemo(() => {
    if (chapter < (book?.chapterCount ?? 0)) {
      return `/read/${bookID}/${chapter + 1}?t=${translationID}`;
    }
    if (bookIdx < BOOKS.length - 1) {
      return `/read/${BOOKS[bookIdx + 1].id}/1?t=${translationID}`;
    }
    return "#";
  }, [bookID, chapter, bookIdx, book?.chapterCount, translationID]);

  function toggle(v: number) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v); else next.add(v);
      return next;
    });
  }

  async function openInsight() {
    if (selected.size === 0) return;
    const sorted = [...selected].sort((a, b) => a - b);
    const reference: PassageReference = {
      bookID, chapter,
      startVerse: sorted[0],
      endVerse: sorted[sorted.length - 1],
    };
    setInsightOpen(true);
    setInsightLoading(true);
    setInsightError(null);
    setInsight(null);
    try {
      const verseObjs = verses.filter(v => selected.has(v.verse));
      const res = await fetch("/api/insight", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reference, verses: verseObjs }),
      });
      if (!res.ok) throw new Error(`Insight request failed (${res.status})`);
      setInsight(await res.json());
    } catch (e) {
      setInsightError(e instanceof Error ? e.message : String(e));
    } finally {
      setInsightLoading(false);
    }
  }

  if (!book) return <p className="p-8">Unknown book: {bookID}</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <ReaderHeader translationID={translationID} bookID={bookID} chapter={chapter} />

      {unavailable ? (
        <UnavailableCard name={unavailable.name} reason={unavailable.reason} />
      ) : errorMessage ? (
        <p className="text-red-600 my-4">{errorMessage}</p>
      ) : (
        <article className="space-y-2 leading-relaxed text-lg">
          {verses.map(v => {
            const on = selected.has(v.verse);
            return (
              <p key={v.verse}
                 onClick={() => toggle(v.verse)}
                 className={`cursor-pointer rounded px-2 py-1 -mx-2 transition ${
                   on ? "bg-yellow-200/50 dark:bg-yellow-400/15" : "hover:bg-[var(--surface)]"
                 }`}>
                <sup className="text-xs text-[var(--muted)] mr-1 font-ui">
                  {v.verse}
                </sup>
                {v.text}
              </p>
            );
          })}
        </article>
      )}

      <nav className="mt-10 flex items-center justify-between font-ui text-sm">
        {canPrev
          ? <Link href={prevHref} className="hover:text-[var(--accent)]">← Previous</Link>
          : <span />}
        {canNext
          ? <Link href={nextHref} className="hover:text-[var(--accent)]">Next →</Link>
          : <span />}
      </nav>

      {selected.size > 0 && !unavailable && (
        <button
          onClick={openInsight}
          className="font-ui fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] text-white px-5 py-3 shadow-lg hover:opacity-90 transition">
          ✦ Get Insight ({selected.size})
        </button>
      )}

      {insightOpen && (
        <InsightDrawer
          loading={insightLoading}
          error={insightError}
          insight={insight}
          referenceDisplay={referenceDisplay(bookID, chapter, selected)}
          onClose={() => setInsightOpen(false)} />
      )}
    </div>
  );
}

function ReaderHeader({ translationID, bookID, chapter }: { translationID: string; bookID: string; chapter: number }) {
  const book = BOOKS_BY_ID[bookID];
  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <Link href="/read/picker"
              className="font-ui text-sm text-[var(--muted)] hover:text-[var(--accent)]">
          Books ▾
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {book?.name} {chapter}
        </h1>
      </div>
      <TranslationPicker current={translationID} bookID={bookID} chapter={chapter} />
    </header>
  );
}

function TranslationPicker({ current, bookID, chapter }: { current: string; bookID: string; chapter: number }) {
  return (
    <form action={`/read/${bookID}/${chapter}`} className="font-ui text-sm">
      <select name="t" defaultValue={current}
              onChange={e => { e.currentTarget.form?.requestSubmit(); }}
              className="bg-transparent border border-[var(--border)] rounded px-2 py-1">
        <option value="KJV">KJV</option>
        <option value="BBE">BBE</option>
        <option value="ESV">ESV</option>
      </select>
    </form>
  );
}

function UnavailableCard({ name, reason }: { name: string; reason: string }) {
  return (
    <div className="rounded-xl border border-orange-300 bg-orange-50 dark:bg-orange-950/20 p-4 my-6 font-ui">
      <h2 className="font-semibold text-orange-700 dark:text-orange-300 mb-1">
        {name} needs setup
      </h2>
      <p className="text-sm">{reason}</p>
    </div>
  );
}

function InsightDrawer({
  loading, error, insight, referenceDisplay, onClose,
}: {
  loading: boolean; error: string | null;
  insight: PassageInsight | null;
  referenceDisplay: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-20 flex items-end md:items-center justify-center bg-black/40">
      <div className="bg-[var(--background)] w-full md:max-w-xl md:rounded-2xl rounded-t-2xl shadow-2xl max-h-[85vh] overflow-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] font-ui">
          <h3 className="font-semibold">Insight — {referenceDisplay}</h3>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--accent)]">✕</button>
        </div>
        <div className="px-5 py-6 space-y-4 leading-relaxed">
          {loading && <p className="text-[var(--muted)]">Gathering context…</p>}
          {error && <p className="text-red-600">{error}</p>}
          {insight && (
            <>
              <Section label="Summary">{insight.summary}</Section>
              <Section label="Context">{insight.context}</Section>
              {insight.crossReferences.length > 0 && (
                <Section label="Cross-references">
                  <ul className="list-disc pl-5">
                    {insight.crossReferences.map(r => <li key={r}>{r}</li>)}
                  </ul>
                </Section>
              )}
              <Section label="Sources">
                <ul className="text-sm">
                  {insight.citations.map(c => (
                    <li key={c.sourceURL}>
                      <a href={c.sourceURL} target="_blank" rel="noopener noreferrer"
                         className="underline hover:text-[var(--accent)]">
                        {c.author} — {c.sourceURL}
                      </a>
                    </li>
                  ))}
                </ul>
              </Section>
              <p className="text-xs text-[var(--muted)] font-ui">
                AI-generated study aid. Not Scripture. Verify against the text.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-ui font-semibold text-sm uppercase tracking-wide text-[var(--muted)] mb-1">{label}</h4>
      <div>{children}</div>
    </div>
  );
}

function referenceDisplay(bookID: string, chapter: number, selected: Set<number>): string {
  if (selected.size === 0) return `${bookID} ${chapter}`;
  const sorted = [...selected].sort((a, b) => a - b);
  const first = sorted[0], last = sorted[sorted.length - 1];
  return first === last
    ? `${BOOKS_BY_ID[bookID]?.name} ${chapter}:${first}`
    : `${BOOKS_BY_ID[bookID]?.name} ${chapter}:${first}-${last}`;
}
