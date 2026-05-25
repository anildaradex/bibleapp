# BibleApp (working name — to be renamed)

The best Bible research app on earth — built on Biblical principles and sound doctrine.

## Vision

A daily companion for serious Bible study that combines:
- The readability and accessibility of **BibleGateway**
- The depth and cross-referencing of **Logos**
- AI-powered passage summaries grounded in trusted, doctrinally-sound commentary

Aim is to make spending time in God's Word the easiest, most rewarding part of the user's day.

## Core Pillars

1. **Read** — NKJV and NIV translations, side-by-side comparison, clean typography.
2. **Understand** — Tap any passage to get an AI-generated summary and historical/literary context, powered by a Gemma model fine-tuned on [Precept Austin](https://www.preceptaustin.org/) commentaries.
3. **Grow** — A spiritual-journey meter that tracks daily time in the Word, streaks, books completed, and reading goals.
4. **Search** — Fast topical, verse, and cross-reference search across both translations and commentary.

## Translations (v1)

- New King James Version (NKJV)
- New International Version (NIV)

Both will require license agreements with respective publishers (Thomas Nelson / Biblica) before shipping. See [docs/licensing.md](docs/licensing.md).

## Tech Stack

- **Platform:** iOS 17+ (iPhone first, iPad later)
- **UI:** SwiftUI
- **Storage:** SwiftData (reading history, bookmarks, journey meter)
- **AI:** Gemma (on-device via MLC / Core ML where feasible; cloud fallback) fine-tuned on Precept Austin corpus
- **Search:** SQLite FTS5 for verse + commentary search

## Folder Map

```
BibleApp/
├── BibleApp/                  # Xcode app target
│   ├── BibleAppApp.swift      # App entry
│   ├── ContentView.swift      # Root tab view
│   ├── Features/
│   │   ├── Reader/            # Bible reading UI
│   │   ├── Tracker/           # Journey meter & streaks
│   │   ├── AISummary/         # Gemma-powered passage context
│   │   └── Search/            # Verse + topical search
│   ├── Models/                # Bible, Verse, ReadingSession, JourneyMeter
│   ├── Services/              # BibleService, GemmaService, TrackerService
│   └── Resources/             # Bible JSON/SQLite, assets
├── docs/                      # PRD, licensing notes, doctrine guardrails
└── ml/gemma-training/         # Corpus prep + fine-tuning notes for Gemma
```

## Status

Day 0 scaffold. No translation data, no trained model, no Xcode project file yet — that gets generated when you open `BibleApp/` in Xcode and create a new iOS App target pointed at the existing source files.
