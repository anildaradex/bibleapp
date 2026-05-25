"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BOOKS, BOOKS_BY_ID, indexOf } from "@/lib/books";
import { recordSession } from "@/lib/tracker";
import { langForTranslation } from "@/lib/speech";
import { SpeakButton } from "@/components/SpeakButton";
import type { PassageInsight, PassageReference, Translation, Verse } from "@/lib/types";

type FontSize = "normal" | "large";
const FONT_KEY = "bibleapp.fontSize";

interface TranslationOption extends Translation {
  available: boolean;
  reason: string | null;
}

interface Props {
  translationID: string;
  bookID: string;
  chapter: number;
  verses: Verse[];
  /** All translations (so the picker can show NIV/NKJV/Tamil/Telugu too). */
  translations: TranslationOption[];
  /** Provider-level unavailability (e.g. ESV with no key). */
  unavailable?: { name: string; reason: string };
  /** Server-side load error to surface, if any. */
  errorMessage?: string;
}

export function Reader({
  translationID, bookID, chapter, verses, translations, unavailable, errorMessage,
}: Props) {
  const book = BOOKS_BY_ID[bookID];
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [insight, setInsight] = useState<PassageInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<FontSize>("normal");

  // Hydrate font preference from localStorage (client-only, so guard).
  useEffect(() => {
    const stored = typeof window !== "undefined"
      ? (window.localStorage.getItem(FONT_KEY) as FontSize | null)
      : null;
    if (stored === "normal" || stored === "large") setFontSize(stored);
  }, []);

  function changeFont(next: FontSize) {
    setFontSize(next);
    if (typeof window !== "undefined") window.localStorage.setItem(FONT_KEY, next);
  }

  // Track foreground reading time so the Journey meter ticks up when you leave.
  useEffect(() => {
    const start = Date.now();
    return () => {
      const seconds = (Date.now() - start) / 1000;
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

  const verseTextClass = fontSize === "large" ? "text-2xl" : "text-lg";
  const verseLineClass = fontSize === "large" ? "leading-loose" : "leading-relaxed";
  const lang = langForTranslation(translationID);

  // Build the spoken text: "Chapter N. Verse 1. ... Verse 2. ..." so the
  // listener hears verse boundaries even without seeing them.
  function chapterAsSpeech(): string {
    return [
      `${book?.name ?? bookID} ${chapter}.`,
      ...verses.map(v => `Verse ${v.verse}. ${v.text}`),
    ].join(" ");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <ReaderHeader
        translationID={translationID} bookID={bookID} chapter={chapter}
        translations={translations}
        fontSize={fontSize} onChangeFont={changeFont}
      />

      {!unavailable && !errorMessage && verses.length > 0 && (
        <div className="mb-4">
          <SpeakButton getText={chapterAsSpeech} lang={lang} label="Listen to chapter" />
        </div>
      )}

      {unavailable ? (
        <UnavailableCard name={unavailable.name} reason={unavailable.reason} />
      ) : errorMessage ? (
        <p className="text-red-600 my-4">{errorMessage}</p>
      ) : (
        <article className={`space-y-2 ${verseLineClass} ${verseTextClass}`}>
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
          insightLang="en-US"
          onClose={() => setInsightOpen(false)} />
      )}
    </div>
  );
}

function ReaderHeader({
  translationID, bookID, chapter, translations, fontSize, onChangeFont,
}: {
  translationID: string; bookID: string; chapter: number;
  translations: TranslationOption[];
  fontSize: FontSize;
  onChangeFont: (s: FontSize) => void;
}) {
  const book = BOOKS_BY_ID[bookID];
  return (
    <header className="flex items-start justify-between mb-6 gap-3 flex-wrap">
      <div>
        <Link href="/read/picker"
              className="font-ui text-sm text-[var(--muted)] hover:text-[var(--accent)]">
          Books ▾
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {book?.name} {chapter}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <FontSizeToggle current={fontSize} onChange={onChangeFont} />
        <TranslationPicker current={translationID} bookID={bookID} chapter={chapter}
                           translations={translations} />
      </div>
    </header>
  );
}

function FontSizeToggle({ current, onChange }: { current: FontSize; onChange: (s: FontSize) => void }) {
  return (
    <div className="font-ui text-sm flex border border-[var(--border)] rounded overflow-hidden">
      <button type="button" onClick={() => onChange("normal")}
              className={`px-2 py-1 ${current === "normal" ? "bg-[var(--accent)] text-white" : "hover:bg-[var(--surface)]"}`}
              title="Normal text size" aria-pressed={current === "normal"}>
        <span className="text-xs">Aa</span>
      </button>
      <button type="button" onClick={() => onChange("large")}
              className={`px-2 py-1 ${current === "large" ? "bg-[var(--accent)] text-white" : "hover:bg-[var(--surface)]"}`}
              title="Large text size" aria-pressed={current === "large"}>
        <span className="text-base">Aa</span>
      </button>
    </div>
  );
}

function TranslationPicker({
  current, bookID, chapter, translations,
}: {
  current: string; bookID: string; chapter: number;
  translations: TranslationOption[];
}) {
  return (
    <form action={`/read/${bookID}/${chapter}`} className="font-ui text-sm">
      <select name="t" defaultValue={current}
              onChange={e => { e.currentTarget.form?.requestSubmit(); }}
              className="bg-transparent border border-[var(--border)] rounded px-2 py-1">
        {translations.map(t => (
          <option key={t.id} value={t.id}>
            {t.id}{t.available ? "" : " (setup)"}
          </option>
        ))}
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
  loading, error, insight, referenceDisplay, insightLang, onClose,
}: {
  loading: boolean; error: string | null;
  insight: PassageInsight | null;
  referenceDisplay: string;
  insightLang: string;
  onClose: () => void;
}) {
  // Reading "the notes": summary + context, no citations/cross-refs noise.
  const notesText = insight
    ? `${referenceDisplay}. Summary. ${insight.summary} Context. ${insight.context}`
    : "";

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
              <SpeakButton getText={() => notesText} lang={insightLang} label="Listen to notes" />
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
