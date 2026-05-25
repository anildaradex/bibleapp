import Link from "next/link";
import { BOOKS } from "@/lib/books";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Books — BibleApp",
};

export default function BookPickerPage() {
  const ot = BOOKS.filter(b => b.testament === "old");
  const nt = BOOKS.filter(b => b.testament === "new");
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Books</h1>
      <Section title="Old Testament" books={ot} />
      <Section title="New Testament" books={nt} />
    </div>
  );
}

function Section({ title, books }: { title: string; books: typeof BOOKS }) {
  return (
    <section className="mb-10">
      <h2 className="font-ui text-sm uppercase tracking-wide text-[var(--muted)] mb-3">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 font-ui text-sm">
        {books.map(b => (
          <Link
            key={b.id}
            href={`/read/${b.id}/1`}
            className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 hover:border-[var(--accent)] hover:text-[var(--accent)] transition"
          >
            {b.name}
            <span className="text-[var(--muted)] ml-2 text-xs">{b.chapterCount} ch</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
