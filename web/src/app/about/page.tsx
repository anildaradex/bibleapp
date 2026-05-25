import type { Metadata } from "next";
import { listTranslations } from "@/lib/bibleService";

export const metadata: Metadata = {
  title: "About — BibleApp",
};

export default function AboutPage() {
  const translations = listTranslations();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8 leading-relaxed">
      <section>
        <h1 className="text-3xl font-semibold mb-3">About BibleApp</h1>
        <p>
          BibleApp is a Bible-research tool built on Biblical principles and
          sound doctrine. It combines the readability of Bible Gateway and
          the depth of Logos with AI-powered passage context grounded in
          trusted commentary sources.
        </p>
      </section>

      <section>
        <h2 className="font-ui font-semibold mb-2">Translations</h2>
        <ul className="space-y-3">
          {translations.map(t => (
            <li key={t.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">{t.id}</span>
                  <span className="text-[var(--muted)] ml-2">{t.name}</span>
                </div>
                <span className={`font-ui text-xs px-2 py-0.5 rounded-full ${
                  t.available
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                }`}>
                  {t.available ? "ready" : "needs setup"}
                </span>
              </div>
              <p className="font-ui text-xs text-[var(--muted)] mt-1">{t.publisher}</p>
              {t.reason && (
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-2">{t.reason}</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-ui font-semibold mb-2">Doctrinal guardrails</h2>
        <p>
          Scripture is the inspired, inerrant, authoritative Word of God.
          AI features are explicitly study aids — never authoritative — and
          every AI response cites its source and reminds you to verify
          against the text.
        </p>
      </section>

      <section>
        <h2 className="font-ui font-semibold mb-2">Open source</h2>
        <p className="font-ui text-sm">
          Code at <a className="underline" href="https://github.com/anildaradex/bibleapp">github.com/anildaradex/bibleapp</a>.
        </p>
      </section>
    </div>
  );
}
