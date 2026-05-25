import Foundation

/// Crossway ESV API (api.esv.org). Free key for personal/non-commercial use:
/// https://api.esv.org/account/create-application/
///
/// We use the `/v3/passage/text/` endpoint and parse verse markers ([N])
/// back into individual Verse records so the rest of the app doesn't care
/// where the text came from.
final class ESVProvider: TranslationProvider {
    let translation = Translation(id: "ESV",
                                  name: "English Standard Version",
                                  publisher: "Crossway")

    private let session: URLSession
    private var diskCache: URL? = {
        let fm = FileManager.default
        guard let base = fm.urls(for: .cachesDirectory, in: .userDomainMask).first else { return nil }
        let dir = base.appendingPathComponent("esv-passages", isDirectory: true)
        try? fm.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }()

    init(session: URLSession = .shared) { self.session = session }

    private var apiKey: String {
        UserDefaults.standard.string(forKey: "esvAPIKey")?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    }

    var isAvailable: Bool { !apiKey.isEmpty }
    var unavailabilityReason: String? {
        isAvailable ? nil
        : "Add a free ESV API key in Settings → Translations to enable. Get one at api.esv.org."
    }

    // MARK: - Chapter

    func chapter(bookID: String, chapter: Int) async throws -> [Verse] {
        guard let book = BibleBooks.book(id: bookID) else {
            throw BibleServiceError.bookNotFound(bookID)
        }
        let query = "\(book.name) \(chapter)"
        if let cached = readCache(key: cacheKey(query)) {
            return parse(passage: cached, bookID: bookID, chapter: chapter)
        }
        let passage = try await fetchPassage(query: query)
        writeCache(key: cacheKey(query), value: passage)
        return parse(passage: passage, bookID: bookID, chapter: chapter)
    }

    // MARK: - Search

    func search(query: String) async throws -> [Verse] {
        guard isAvailable else { throw ESVError.missingKey }
        var components = URLComponents(string: "https://api.esv.org/v3/passage/search/")!
        components.queryItems = [
            URLQueryItem(name: "q", value: query),
            URLQueryItem(name: "page-size", value: "50")
        ]
        var req = URLRequest(url: components.url!)
        req.setValue("Token \(apiKey)", forHTTPHeaderField: "Authorization")
        let (data, response) = try await session.data(for: req)
        try Self.validate(response: response, data: data)
        let decoded = try JSONDecoder().decode(ESVSearchResponse.self, from: data)
        return decoded.results.compactMap { hit in
            guard let parsed = ReferenceParser.parse(hit.reference) else { return nil }
            return Verse(translationID: translation.id,
                         bookID: parsed.bookID,
                         chapter: parsed.chapter,
                         verse: parsed.startVerse,
                         text: hit.content.trimmingCharacters(in: .whitespacesAndNewlines))
        }
    }

    // MARK: - Networking

    private func fetchPassage(query: String) async throws -> String {
        guard isAvailable else { throw ESVError.missingKey }
        var components = URLComponents(string: "https://api.esv.org/v3/passage/text/")!
        components.queryItems = [
            URLQueryItem(name: "q", value: query),
            URLQueryItem(name: "include-passage-references", value: "false"),
            URLQueryItem(name: "include-verse-numbers", value: "true"),
            URLQueryItem(name: "include-footnotes", value: "false"),
            URLQueryItem(name: "include-headings", value: "false"),
            URLQueryItem(name: "include-short-copyright", value: "false"),
            URLQueryItem(name: "include-passage-horizontal-lines", value: "false"),
            URLQueryItem(name: "include-heading-horizontal-lines", value: "false"),
            URLQueryItem(name: "indent-paragraphs", value: "0"),
            URLQueryItem(name: "indent-poetry", value: "false"),
        ]
        var req = URLRequest(url: components.url!)
        req.setValue("Token \(apiKey)", forHTTPHeaderField: "Authorization")
        let (data, response) = try await session.data(for: req)
        try Self.validate(response: response, data: data)
        let decoded = try JSONDecoder().decode(ESVPassageResponse.self, from: data)
        return decoded.passages.joined(separator: "\n")
    }

    private static func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else { return }
        switch http.statusCode {
        case 200..<300: return
        case 401, 403: throw ESVError.invalidKey
        case 429: throw ESVError.rateLimited
        default:
            let body = String(data: data, encoding: .utf8) ?? ""
            throw ESVError.http(http.statusCode, body)
        }
    }

    // MARK: - Parse

    /// ESV chapter text comes back as one blob like
    /// `[1] In the beginning... [2] And the earth...`
    /// Verse numbers appear as `[N]` (square brackets, no decoration).
    private func parse(passage: String, bookID: String, chapter: Int) -> [Verse] {
        // Match "[<digits>] " then capture everything up to the next "[<digits>]" or end.
        let pattern = #"\[(\d+)\]\s*([\s\S]*?)(?=\s*\[\d+\]|\z)"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return [] }
        let ns = passage as NSString
        let matches = regex.matches(in: passage, range: NSRange(location: 0, length: ns.length))
        return matches.compactMap { m in
            guard m.numberOfRanges == 3,
                  let n = Int(ns.substring(with: m.range(at: 1))) else { return nil }
            let text = ns.substring(with: m.range(at: 2))
                .trimmingCharacters(in: .whitespacesAndNewlines)
            return Verse(translationID: translation.id, bookID: bookID,
                         chapter: chapter, verse: n, text: text)
        }
    }

    // MARK: - Cache (round-trip-free re-reads of the same chapter)

    private func cacheKey(_ query: String) -> String {
        query.lowercased()
             .replacingOccurrences(of: " ", with: "_")
             .replacingOccurrences(of: ":", with: "-")
    }

    private func readCache(key: String) -> String? {
        guard let dir = diskCache else { return nil }
        let url = dir.appendingPathComponent("\(key).txt")
        return try? String(contentsOf: url, encoding: .utf8)
    }

    private func writeCache(key: String, value: String) {
        guard let dir = diskCache else { return }
        try? value.write(to: dir.appendingPathComponent("\(key).txt"),
                         atomically: true, encoding: .utf8)
    }
}

// MARK: - DTOs

private struct ESVPassageResponse: Decodable {
    let passages: [String]
}

private struct ESVSearchResponse: Decodable {
    let results: [Hit]
    struct Hit: Decodable {
        let reference: String
        let content: String
    }
}

enum ESVError: LocalizedError {
    case missingKey, invalidKey, rateLimited, http(Int, String)
    var errorDescription: String? {
        switch self {
        case .missingKey:   "ESV API key is not set. Add it in Settings → Translations."
        case .invalidKey:   "ESV API rejected the key. Re-check it in Settings."
        case .rateLimited:  "ESV API rate limit reached. Try again shortly."
        case .http(let c, let b): "ESV API error \(c): \(b.prefix(120))"
        }
    }
}

/// Parses references like "John 3:16", "1 John 2:1-3", "John 3" into our schema.
enum ReferenceParser {
    static let bookByLowercaseName: [String: String] = {
        var map: [String: String] = [:]
        for book in BibleBooks.all {
            map[book.name.lowercased()] = book.id
        }
        return map
    }()

    static func parse(_ raw: String) -> PassageReference? {
        let s = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        // Find the last space before "C[:V[-V]]" — the book name may have a digit prefix.
        let pattern = #"^(.+?)\s+(\d+)(?::(\d+)(?:[-–](\d+))?)?$"#
        guard let regex = try? NSRegularExpression(pattern: pattern),
              let m = regex.firstMatch(in: s, range: NSRange(location: 0, length: (s as NSString).length)),
              m.numberOfRanges >= 3 else { return nil }
        let ns = s as NSString
        let bookName = ns.substring(with: m.range(at: 1)).lowercased()
        guard let bookID = bookByLowercaseName[bookName] else { return nil }
        guard let chapter = Int(ns.substring(with: m.range(at: 2))) else { return nil }
        let start = m.range(at: 3).location != NSNotFound
            ? Int(ns.substring(with: m.range(at: 3))) ?? 1 : 1
        let end = m.range(at: 4).location != NSNotFound
            ? Int(ns.substring(with: m.range(at: 4))) ?? start : start
        return PassageReference(bookID: bookID, chapter: chapter,
                                startVerse: start, endVerse: end)
    }
}
