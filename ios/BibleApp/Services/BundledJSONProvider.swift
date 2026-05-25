import Foundation

/// Reads a public-domain translation from a bundled JSON file in the
/// `bibles/` folder reference. File format (thiagobodruk/bible):
/// an array of 66 books in canonical order, each
/// `{ "abbrev": <string>, "chapters": [[verse1, verse2, ...], ...] }`.
final class BundledJSONProvider: TranslationProvider {
    let translation: Translation
    private let resourceName: String

    private struct RawBook: Decodable {
        let abbrev: String
        let chapters: [[String]]
    }

    private var cache: [RawBook]?

    init(translation: Translation, resourceName: String) {
        self.translation = translation
        self.resourceName = resourceName
    }

    var isAvailable: Bool { true }
    var unavailabilityReason: String? { nil }

    private func loadBooks() throws -> [RawBook] {
        if let cache { return cache }
        guard let url = Bundle.main.url(forResource: resourceName, withExtension: "json", subdirectory: "bibles")
                ?? Bundle.main.url(forResource: resourceName, withExtension: "json") else {
            throw BibleServiceError.translationNotBundled(translation.id)
        }
        let data = try Data(contentsOf: url)
        let bom: [UInt8] = [0xEF, 0xBB, 0xBF]
        let cleaned: Data = data.starts(with: bom) ? data.subdata(in: 3..<data.count) : data
        let decoded = try JSONDecoder().decode([RawBook].self, from: cleaned)
        cache = decoded
        return decoded
    }

    func chapter(bookID: String, chapter: Int) async throws -> [Verse] {
        let books = try loadBooks()
        guard let i = BibleBooks.index(of: bookID), i < books.count else {
            throw BibleServiceError.bookNotFound(bookID)
        }
        let raw = books[i]
        let cIdx = chapter - 1
        guard cIdx >= 0, cIdx < raw.chapters.count else {
            throw BibleServiceError.chapterOutOfRange(bookID, chapter)
        }
        return raw.chapters[cIdx].enumerated().map { (vi, text) in
            Verse(translationID: translation.id, bookID: bookID,
                  chapter: chapter, verse: vi + 1, text: text)
        }
    }

    func search(query: String) async throws -> [Verse] {
        let needle = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard needle.count >= 2 else { return [] }
        let books = try loadBooks()
        var hits: [Verse] = []
        for (bi, raw) in books.enumerated() {
            guard bi < BibleBooks.all.count else { break }
            let bookID = BibleBooks.all[bi].id
            for (ci, verses) in raw.chapters.enumerated() {
                for (vi, text) in verses.enumerated() where text.lowercased().contains(needle) {
                    hits.append(Verse(translationID: translation.id, bookID: bookID,
                                      chapter: ci + 1, verse: vi + 1, text: text))
                    if hits.count >= 200 { return hits }
                }
            }
        }
        return hits
    }
}
