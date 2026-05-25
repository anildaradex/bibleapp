import Foundation
import SwiftData

/// Owns the spiritual-journey meter: starts/stops reading sessions and
/// rolls their duration up into the per-day JourneyMeter row.
@MainActor
final class TrackerService {
    static let shared = TrackerService()
    private init() {}

    private static let dayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = .current
        return f
    }()

    static func dayKey(_ date: Date = .now) -> String {
        dayFormatter.string(from: date)
    }

    func startSession(context: ModelContext, bookID: String, chapter: Int) -> ReadingSession {
        let session = ReadingSession(bookID: bookID, chapter: chapter)
        context.insert(session)
        return session
    }

    func endSession(_ session: ReadingSession, versesRead: Int, context: ModelContext, goalMinutes: Int) {
        session.endedAt = .now
        session.versesRead = versesRead

        let key = Self.dayKey(session.startedAt)
        let descriptor = FetchDescriptor<JourneyMeter>(predicate: #Predicate { $0.dayKey == key })
        let meter = (try? context.fetch(descriptor).first) ?? {
            let new = JourneyMeter(dayKey: key, goalMinutes: goalMinutes)
            context.insert(new)
            return new
        }()

        meter.minutesInWord += session.durationSeconds / 60.0
        meter.versesRead += versesRead
        meter.chaptersRead += 1
    }

    func currentStreak(context: ModelContext) -> Int {
        let descriptor = FetchDescriptor<JourneyMeter>(sortBy: [SortDescriptor(\.dayKey, order: .reverse)])
        guard let meters = try? context.fetch(descriptor) else { return 0 }
        var streak = 0
        var cursor = Date.now
        for meter in meters {
            let cursorKey = Self.dayKey(cursor)
            if meter.dayKey == cursorKey && meter.progress >= 1.0 {
                streak += 1
                cursor = Calendar.current.date(byAdding: .day, value: -1, to: cursor) ?? cursor
            } else {
                break
            }
        }
        return streak
    }
}
