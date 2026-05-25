import Foundation

/// A pluggable backend for one translation. Today: bundled JSON for KJV/BBE,
/// HTTPS for ESV. Tomorrow: API.Bible, on-device SQLite, etc.
protocol TranslationProvider {
    var translation: Translation { get }
    var isAvailable: Bool { get }
    var unavailabilityReason: String? { get }   // shown in UI when isAvailable == false
    func chapter(bookID: String, chapter: Int) async throws -> [Verse]
    func search(query: String) async throws -> [Verse]
}
