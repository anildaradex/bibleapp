# BibleApp

The best Bible research app on earth — built on Biblical principles and sound doctrine.

A daily Bible-study companion that combines the readability of **Bible Gateway**, the depth of **Logos**, and AI-powered passage context grounded in trusted commentary. Read Scripture in KJV / BBE / ESV, get short summaries and historical context for any selected passage, and track your time in the Word with a daily journey meter.

## Repo layout

```
bibleapp/
├── ios/    — SwiftUI iPhone app (Xcode 26+, iOS 17+)
├── web/    — Next.js 16 web app (React 19, Tailwind 4)
└── README.md
```

Both apps share the same:
- 66-book canonical catalog
- `TranslationProvider` interface
- Bundled KJV / BBE JSON (public domain)
- ESV API integration via [api.esv.org](https://api.esv.org)
- AI passage-insight contract (Gemma model, fine-tuned on Precept Austin + public-domain commentaries — model itself is WIP)

See [`ios/docs/`](ios/docs/) for the product spec, doctrinal guardrails, and licensing notes. See [`ios/ml/gemma-training/`](ios/ml/gemma-training/) for the model plan.

## iOS — quick start

```bash
cd ios
open BibleApp.xcodeproj    # then ⌘R in Xcode
# If sources/translations are missing from the target, run: xcodegen generate
```

The app opens on John 3 in KJV. Tap the book icon to navigate; tap verses to select; ✨ Insight surfaces the Gemma stub. To enable ESV, Settings → Translations → Add ESV API key.

## Web — quick start

```bash
cd web
npm install
npm run dev   # http://localhost:3000
```

To enable ESV: `cp .env.example .env.local`, paste your key from [api.esv.org/account/create-application/](https://api.esv.org/account/create-application/), restart.

## Vision pillars

1. **Read** — clean Scripture text, multiple translations, parallel view planned.
2. **Understand** — tap a passage, get AI summary + historical context grounded in cited commentary.
3. **Grow** — spiritual-journey meter tracks daily time in the Word, streak, plan progress.
4. **Search** — fast reference + keyword search across every loaded translation.

## Translations

| ID  | Name                          | Source              | Status            |
| --- | ----------------------------- | ------------------- | ----------------- |
| KJV | King James Version (1611)     | Public domain       | bundled, works offline |
| BBE | Bible in Basic English (1949) | Public domain       | bundled, works offline |
| ESV | English Standard Version      | Crossway API        | free key required |
| NIV | New International Version     | Biblica / Zondervan | needs commercial license — see ios/docs/licensing.md |
| NKJV| New King James Version        | Thomas Nelson       | needs commercial license — see ios/docs/licensing.md |

## Doctrinal frame

Scripture is the inspired, inerrant, authoritative Word of God. AI features are explicitly **study aids, not Scripture** — every AI output cites its source and prompts the user to verify against the text. Full rubric in [`ios/docs/doctrine-guardrails.md`](ios/docs/doctrine-guardrails.md).

## License

Code: see top-level `LICENSE` (TBD — likely MIT for application code).
Bundled translations (KJV, BBE) are public domain.
ESV text is © Crossway — accessed via API under their personal-use terms; never redistributed in this repo.
