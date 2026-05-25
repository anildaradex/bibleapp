import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BibleApp — Bible Research, Built on the Word",
  description:
    "The best Bible research app on earth. Read Scripture in KJV, BBE, ESV. AI-powered passage context grounded in trusted commentary. Track your time in the Word.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur sticky top-0 z-10">
          <nav className="font-ui mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              <span className="text-[var(--accent)]">✦</span> BibleApp
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/" className="hover:text-[var(--accent)]">Journey</Link>
              <Link href="/read" className="hover:text-[var(--accent)]">Read</Link>
              <Link href="/search" className="hover:text-[var(--accent)]">Search</Link>
              <Link href="/speakers" className="hover:text-[var(--accent)]">Speakers</Link>
              <Link href="/about" className="hover:text-[var(--accent)]">About</Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[var(--border)] font-ui text-xs text-[var(--muted)] py-4 mt-12">
          <div className="mx-auto max-w-5xl px-4">
            Built on Biblical principles. AI summaries are study aids, not Scripture.
          </div>
        </footer>
      </body>
    </html>
  );
}
