import Foundation

/// bolls.life — free Bible API. We use it for NIV and NKJV (no key required).
///
/// Endpoints:
///   GET https://bolls.life/get-text/<TRANSLATION>/<bookNum>/<chapter>/
///     → [{ pk, verse, text }, ...]
///   GET https://bolls.life/v2/find/<TRANSLATION>/?search=<q>&match_whole=false
///     → [{ book, chapter, verse, text }, ...]
///
/// Book numbers are 1-indexed against canonical order (Genesis = 1).
/// Personal-use only — see the parent project's licensing notes.
final class BollsProvider: TranslationProvider {
    let translation: Translation
    private let remoteCode: String
    private let session: URLSession

    private var diskCache: URL? = {
        let fm = FileManager.default
        guard let base = fm.urls(for: .cachesDirectory, in: .userDomainMask).first else { return nil }
        let dir = base.appendingPathComponent("bolls-passages", isDirectory: true)
        try? fm.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }()

    init(translation: Translation, remoteCode: String, session: URLSession = .shared) {
        self.translation = translation
        self.remoteCode = remoteCode
        self.session = session
    }

    var isAvailable: Bool { true }
    var unavailabilityReason: String? { nil }

    // MARK: - Chapter

    func chapter(bookID: String, chapter: Int) async throws -> [Verse] {
        guard let bookIdx = BibleBooks.index(of: bookID) else {
            throw BibleServiceError.bookNotFound(bookID)
        }
        let cacheKey = "\(remoteCode)_\(bookID)_\(chapter)"
        if let cached = readCache(cacheKey), let rows = try? JSONDecoder().decode([BollsRow].self, from: cached) {
            return rows.map { row in
                Verse(translationID: translation.id, bookID: bookID,
                      chapter: chapter, verse: row.verse, text: Self.clean(row.text))
            }
        }

        let url = URL(string: "https://bolls.life/get-text/\(remoteCode)/\(bookIdx + 1)/\(chapter)/")!
        let (data, response) = try await session.data(from: url)
        try Self.validate(response: response, data: data)
        let rows = try JSONDecoder().decode([BollsRow].self, from: data)
        writeCache(cacheKey, value: data)
        return rows.map { row in
            Verse(translationID: translation.id, bookID: bookID,
                  chapter: chapter, verse: row.verse, text: Self.clean(row.text))
        }
    }

    // MARK: - Search

    func search(query: String) async throws -> [Verse] {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.count >= 2 else { return [] }
        var components = URLComponents(string: "https://bolls.life/v2/find/\(remoteCode)/")!
        components.queryItems = [
            URLQueryItem(name: "search", value: trimmed),
            URLQueryItem(name: "match_whole", value: "false")
        ]
        let (data, response) = try await session.data(from: components.url!)
        try Self.validate(response: response, data: data)
        let rows = try JSONDecoder().decode([BollsSearchRow].self, from: data)
        return rows.prefix(200).compactMap { row in
            let idx = row.book - 1
            guard idx >= 0, idx < BibleBooks.all.count else { return nil }
            return Verse(translationID: translation.id,
                         bookID: BibleBooks.all[idx].id,
                         chapter: row.chapter,
                         verse: row.verse,
                         text: Self.clean(row.text))
        }
    }

    // MARK: - Helpers

    private static func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else { return }
        if !(200..<300).contains(http.statusCode) {
            throw BollsError.http(http.statusCode)
        }
    }

    /// bolls inserts `<br/>Section Title<br/>` and `<i>...</i>` into verse text.
    /// Strip all tags and collapse whitespace.
    static func clean(_ s: String) -> String {
        var out = s
            .replacingOccurrences(of: "<br/>", with: " ", options: [.caseInsensitive])
            .replacingOccurrences(of: "<br />", with: " ", options: [.caseInsensitive])
            .replacingOccurrences(of: "<br>", with: " ", options: [.caseInsensitive])
        // Strip remaining tags with a regex.
        if let re = try? NSRegularExpression(pattern: "<[^>]+>") {
            let ns = out as NSString
            out = re.stringByReplacingMatches(in: out, range: NSRange(location: 0, length: ns.length), withTemplate: "")
        }
        // Collapse whitespace.
        if let re = try? NSRegularExpression(pattern: "\\s+") {
            let ns = out as NSString
            out = re.stringByReplacingMatches(in: out, range: NSRange(location: 0, length: ns.length), withTemplate: " ")
        }
        return out.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    // MARK: - Disk cache

    private func readCache(_ key: String) -> Data? {
        guard let dir = diskCache else { return nil }
        return try? Data(contentsOf: dir.appendingPathComponent("\(key).json"))
    }
    private func writeCache(_ key: String, value: Data) {
        guard let dir = diskCache else { return }
        try? value.write(to: dir.appendingPathComponent("\(key).json"))
    }
}

private struct BollsRow: Decodable { let verse: Int; let text: String }
private struct BollsSearchRow: Decodable { let book: Int; let chapter: Int; let verse: Int; let text: String }

enum BollsError: LocalizedError {
    case http(Int)
    var errorDescription: String? {
        switch self {
        case .http(let c): "bolls.life API error \(c)"
        }
    }
}
