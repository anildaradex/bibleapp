import Foundation
import SwiftData

@Model
final class ReadingSession {
    var startedAt: Date
    var endedAt: Date?
    var bookID: String
    var chapter: Int
    var versesRead: Int

    init(startedAt: Date = .now, bookID: String, chapter: Int, versesRead: Int = 0) {
        self.startedAt = startedAt
        self.bookID = bookID
        self.chapter = chapter
        self.versesRead = versesRead
    }

    var durationSeconds: TimeInterval {
        (endedAt ?? .now).timeIntervalSince(startedAt)
    }
}

@Model
final class Bookmark {
    var createdAt: Date
    var bookID: String
    var chapter: Int
    var verse: Int
    var note: String?

    init(bookID: String, chapter: Int, verse: Int, note: String? = nil) {
        self.createdAt = .now
        self.bookID = bookID
        self.chapter = chapter
        self.verse = verse
        self.note = note
    }
}

/// One row per local day. The "meter" the user sees on the Journey tab.
@Model
final class JourneyMeter {
    @Attribute(.unique) var dayKey: String   // "2026-05-25"
    var minutesInWord: Double
    var versesRead: Int
    var chaptersRead: Int
    var goalMinutes: Int

    init(dayKey: String, goalMinutes: Int) {
        self.dayKey = dayKey
        self.minutesInWord = 0
        self.versesRead = 0
        self.chaptersRead = 0
        self.goalMinutes = goalMinutes
    }

    var progress: Double {
        guard goalMinutes > 0 else { return 0 }
        return min(1.0, minutesInWord / Double(goalMinutes))
    }
}
