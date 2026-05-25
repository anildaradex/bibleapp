import Link from "next/link";
import { JourneyMeter } from "@/components/JourneyMeter";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 grid gap-12 md:grid-cols-2 items-start">
      <section>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
          Spend time in the Word.
        </h1>
        <p className="text-lg text-[var(--muted)] mb-6 leading-relaxed">
          The best Bible research app on earth — KJV and BBE built in,
          ESV via your free Crossway key, and AI-powered passage context
          grounded in trusted commentary.
        </p>
        <div className="flex flex-wrap gap-3 font-ui">
          <Link href="/read/JHN/3"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] text-white px-5 py-2.5 font-medium hover:opacity-90 transition">
            Open John 3 →
          </Link>
          <Link href="/search"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 font-medium hover:bg-[var(--surface)] transition">
            Search Scripture
          </Link>
        </div>

        <div className="mt-10 grid gap-3 text-sm font-ui">
          <FeatureRow title="Read"
                      desc="KJV (1611) & BBE (1949) bundled — fully offline." />
          <FeatureRow title="Understand"
                      desc="Tap a verse → AI summary + context with cited sources." />
          <FeatureRow title="Grow"
                      desc="Daily journey meter tracks your time in the Word." />
          <FeatureRow title="Search"
                      desc="Reference or keyword across every loaded translation." />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="font-ui font-semibold mb-4">Today&rsquo;s Journey</h2>
        <JourneyMeter />
      </section>
    </div>
  );
}

function FeatureRow({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-3 items-baseline">
      <span className="text-[var(--accent)]">✦</span>
      <div>
        <span className="font-medium">{title}.</span>{" "}
        <span className="text-[var(--muted)]">{desc}</span>
      </div>
    </div>
  );
}
