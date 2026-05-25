import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Speakers — BibleApp",
  description: "Curated YouTube sermons from trusted preachers.",
};

interface Speaker {
  name: string;
  tagline: string;
  language: string;
  channelUrl: string;
  /** Optional featured video — embedded inline. Use the YouTube video ID
   *  (the bit after `watch?v=`). Leave blank to show only the channel link. */
  featuredVideoId?: string;
  /** Fallback when we don't have a featured video — searches YouTube. */
  searchQuery: string;
  /** Brief, plain-English description for seniors. */
  description: string;
}

const SPEAKERS: Speaker[] = [
  {
    name: "Bro. John Wesley",
    tagline: "Calvary Temple, Hyderabad",
    language: "Telugu",
    channelUrl: "https://www.youtube.com/@CalvaryTempleIndiaOfficial",
    searchQuery: "Bro John Wesley Calvary Temple Telugu sermon",
    description:
      "Telugu preacher and founder of Calvary Temple, Hyderabad. Daily messages in Telugu, often with English subtitles.",
  },
  {
    name: "Billy Graham",
    tagline: "Billy Graham Evangelistic Association",
    language: "English",
    channelUrl: "https://www.youtube.com/@BillyGrahamEvangelisticAssociation",
    searchQuery: "Billy Graham classic sermon",
    description:
      "America's pastor (1918–2018). The Billy Graham Evangelistic Association channel hosts a deep archive of his crusade sermons.",
  },
];

export default function SpeakersPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-semibold mb-2">Speakers</h1>
      <p className="text-[var(--muted)] mb-8">
        Sermons from preachers we trust. Tap a card to watch on YouTube.
      </p>

      <div className="grid gap-6">
        {SPEAKERS.map(s => <SpeakerCard key={s.name} speaker={s} />)}
      </div>

      <p className="mt-10 text-xs text-[var(--muted)]">
        Videos are hosted on YouTube. BibleApp does not control their content.
      </p>
    </div>
  );
}

function SpeakerCard({ speaker }: { speaker: Speaker }) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(speaker.searchQuery)}`;
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <header className="mb-3">
        <h2 className="text-2xl font-semibold">{speaker.name}</h2>
        <p className="text-sm text-[var(--muted)] font-ui">
          {speaker.tagline} · {speaker.language}
        </p>
      </header>
      <p className="mb-4">{speaker.description}</p>

      {speaker.featuredVideoId && (
        <div className="mb-4 aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${speaker.featuredVideoId}`}
            title={`${speaker.name} — featured`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3 font-ui">
        <a href={speaker.channelUrl} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] text-white px-5 py-2.5 hover:opacity-90">
          ▶ Watch on YouTube
        </a>
        <a href={searchUrl} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 hover:bg-[var(--background)]">
          🔎 More sermons
        </a>
      </div>
    </article>
  );
}
