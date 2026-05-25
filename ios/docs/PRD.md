# Product Requirements — BibleApp (v1)

## Mission
Be the best Bible research app on earth, built on Biblical principles and sound doctrine.

## Target user
Believers who want to spend serious daily time in Scripture and grow in understanding — pastors, lay leaders, seminary students, and committed laypeople. The app is also welcoming to newer believers and seekers.

## Doctrinal guardrails
- The Bible is the inspired, inerrant, authoritative Word of God.
- Translations shipped (NKJV, NIV) are both formal/dynamic-equivalent translations from manuscript families consistent with historic Protestant orthodoxy.
- AI features are explicitly NOT a replacement for Scripture — they are study aids grounded in cited commentary. Every AI output cites its source and reminds the user to verify against the text.
- No content that contradicts the historic creeds (Apostles', Nicene). See [doctrine-guardrails.md](doctrine-guardrails.md).

## v1 features

### 1. Reader
- Full text of NKJV and NIV
- Single or parallel two-column view
- Tap-and-hold a verse → action menu (Highlight, Bookmark, Note, AI Summary, Cross-references)
- Reading plans (1-year, chronological, NT-in-90-days at minimum)
- Audio playback (later)

### 2. AI Passage Summary (Gemma)
- User selects a verse range → "Summarize / Get Context" action
- Gemma model returns:
  - 2–3 sentence summary of the passage
  - Historical & cultural context
  - Key cross-references
  - Citation: source commentary on Precept Austin
- On-device inference where the model size allows; cloud fallback otherwise
- All responses are read-only suggestions, never authoritative

### 3. Spiritual Journey Meter
- Daily goal: configurable minutes/day (default 15)
- Tracks:
  - Time-in-Word per day (foreground reader time)
  - Verses read
  - Books completed
  - Current streak / longest streak
  - Reading plan progress
- Visual: a single ring/meter on the home tab + weekly heatmap
- Gentle, non-shaming nudges (no streak-loss anxiety design patterns)

### 4. Search
- Verse reference search ("John 3:16", "jn 3", "psalm 23")
- Full-text keyword search across both translations
- Topical search (later, once commentary corpus is indexed)
- Results show verse + which translation matched

## Out of scope for v1
- Android
- Original-language (Hebrew/Greek) tools — desired for v2
- Sermon recording / journaling beyond simple notes
- Social / sharing features

## Success metrics
- D30 retention > 35%
- Median time-in-Word per active day > 10 minutes
- AI summary CSAT > 4.3 / 5
- Zero doctrinally-flagged AI outputs in review sample (n≥500)
