import Foundation

struct PassageInsight: Codable {
    let summary: String
    let context: String
    let crossReferences: [String]
    let citations: [Citation]

    struct Citation: Codable, Hashable {
        let author: String
        let sourceURL: String
    }
}

/// Talks to the Gemma model fine-tuned on Precept Austin (+ public-domain
/// commentaries). v1 implementation is a cloud call; on-device MLC/Core ML
/// build is a v1.x follow-up.
final class GemmaService {
    static let shared = GemmaService()
    private init() {}

    private let endpoint = URL(string: "https://api.bibleapp.invalid/v1/passage-insight")!

    func insight(for ref: PassageReference, verses: [Verse]) async throws -> PassageInsight {
        // TODO: real HTTPS call. Returning a stub so the UI can render.
        PassageInsight(
            summary: "Summary for \(ref.display) will appear here once Gemma is wired up.",
            context: "Historical and literary context will be sourced from cited commentary entries.",
            crossReferences: [],
            citations: [
                .init(author: "Precept Austin", sourceURL: "https://www.preceptaustin.org/")
            ]
        )
    }
}
