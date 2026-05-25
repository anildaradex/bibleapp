import Foundation

/// Registry of TranslationProviders. Routes chapter/search calls by
/// translationID. Add new providers (API.Bible, on-device SQLite, etc.)
/// by registering them here.
final class BibleService {
    static let shared = BibleService()

    private let providers: [String: TranslationProvider]
    private let order: [String]

    private init() {
        let bundled: [TranslationProvider] = [
            BundledJSONProvider(
                translation: Translation(id: "KJV",
                                         name: "King James Version",
                                         publisher: "Public domain (1611)"),
                resourceName: "KJV"
            ),
            BundledJSONProvider(
                translation: Translation(id: "BBE",
                                         name: "Bible in Basic English",
                                         publisher: "Public domain (1949)"),
                resourceName: "BBE"
            )
        ]
        let api: [TranslationProvider] = [
            ESVProvider()
            // Future: APIBibleProvider(...), NIVProvider(...), etc.
        ]
        let all = bundled + api
        var dict: [String: TranslationProvider] = [:]
        for p in all { dict[p.translation.id] = p }
        self.providers = dict
        self.order = all.map { $0.translation.id }
    }

    /// Every translation we know about, in display order. UI can use
    /// `provider(for:).isAvailable` to decide whether to gate selection.
    var availableTranslations: [Translation] {
        order.compactMap { providers[$0]?.translation }
    }

    func provider(for translationID: String) -> TranslationProvider? {
        providers[translationID]
    }

    func chapter(translationID: String, bookID: String, chapter: Int) async throws -> [Verse] {
        guard let p = providers[translationID] else {
            throw BibleServiceError.translationNotBundled(translationID)
        }
        return try await p.chapter(bookID: bookID, chapter: chapter)
    }

    func search(translationID: String, query: String) async throws -> [Verse] {
        guard let p = providers[translationID] else {
            throw BibleServiceError.translationNotBundled(translationID)
        }
        return try await p.search(query: query)
    }
}

enum BibleServiceError: LocalizedError {
    case translationNotBundled(String)
    case bookNotFound(String)
    case chapterOutOfRange(String, Int)

    var errorDescription: String? {
        switch self {
        case .translationNotBundled(let id): "Translation \(id) is not configured."
        case .bookNotFound(let id): "Unknown book: \(id)."
        case .chapterOutOfRange(let id, let c): "\(id) has no chapter \(c)."
        }
    }
}
