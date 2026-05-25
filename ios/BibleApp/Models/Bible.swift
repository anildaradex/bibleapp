import Foundation

struct Translation: Identifiable, Hashable {
    let id: String        // "NKJV", "NIV"
    let name: String
    let publisher: String
}

struct Book: Identifiable, Hashable {
    let id: String        // "GEN", "JHN"
    let name: String
    let testament: Testament
    let chapterCount: Int
}

enum Testament: String, Codable { case old, new }

struct Verse: Identifiable, Hashable {
    var id: String { "\(translationID)/\(bookID)/\(chapter):\(verse)" }
    let translationID: String
    let bookID: String
    let chapter: Int
    let verse: Int
    let text: String
}

struct PassageReference: Hashable, Codable {
    let bookID: String
    let chapter: Int
    let startVerse: Int
    let endVerse: Int

    var display: String {
        startVerse == endVerse
            ? "\(bookID) \(chapter):\(startVerse)"
            : "\(bookID) \(chapter):\(startVerse)-\(endVerse)"
    }
}
