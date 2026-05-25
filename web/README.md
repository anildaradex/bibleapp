# BibleApp — Web

Next.js 16 / React 19 web companion to the iOS BibleApp. Same data model,
same providers, same AI insight contract — just rendered for the browser
with server-side translation lookups and an SEO-friendly URL per chapter.

## Stack
- **Next.js 16** (App Router, Turbopack, RSC, TypeScript)
- **Tailwind v4**
- **Server-side providers**: bundled JSON (KJV, BBE) + ESV API
- **Client tracker**: `localStorage` for the spiritual-journey meter

## Run it

```bash
npm install   # already done if you scaffolded fresh
npm run dev   # http://localhost:3000
```

## ESV setup (optional)

Get a free key at [api.esv.org/account/create-application/](https://api.esv.org/account/create-application/),
then create `.env.local`:

```
ESV_API_KEY=your-key-here
```

Restart `npm run dev`. ESV will switch from "needs setup" to "ready" in
About, the Reader, and the translation picker. The key stays on the
server — it's never sent to the browser.

## Layout

```
data/bibles/          KJV.json, BBE.json (public domain)
src/lib/
  types.ts            shared TS types
  books.ts            66-book catalog + reference parser
  bibleService.ts     registry, dispatches by translation id
  providers/
    types.ts          TranslationProvider interface
    bundled.ts        KJV / BBE
    esv.ts            ESV API (server-only)
  tracker.ts          journey-meter, localStorage-only
src/app/
  layout.tsx          shell with nav + footer
  page.tsx            home — journey ring + quick start
  read/page.tsx       redirects to /read/JHN/3
  read/picker/        book picker
  read/[book]/[chapter]/page.tsx
                      RSC fetches chapter, renders <Reader>
  search/page.tsx     SSR search results, links to reader
  about/page.tsx      translation status board
  api/passage/        GET ?translation=&book=&chapter=
  api/search/         GET ?translation=&q=
  api/insight/        POST { reference, verses }  (Gemma stub)
  api/translations/   GET → status of all providers
src/components/
  Reader.tsx          interactive chapter view + insight drawer
  JourneyMeter.tsx    SVG ring + 4-week heatmap
```

## What's next

- Real Gemma backend for `/api/insight`
- Bookmarks (server-side once auth lands)
- Reading plans
- Hebrew/Greek tools
