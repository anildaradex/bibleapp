import Foundation
import AVFoundation
import CryptoKit

/// Google Cloud Text-to-Speech — produces dramatically better Telugu /
/// Tamil / English voices than the system AVSpeechSynthesizer voices.
///
/// Uses the same REST API the web app uses, with the API key from
/// `@AppStorage("googleTTSAPIKey")`. The key never leaves the device.
///
/// Each (text + lang + voice) tuple is cached on disk so repeated
/// readings of the same chapter are free and instant.
@MainActor
final class GoogleTTSService {
    static let shared = GoogleTTSService()
    private init() {}

    /// Default voices — Chirp3-HD are the most natural ones Google ships.
    /// Override per language with @AppStorage keys if you want a different one.
    private static let defaultVoices: [String: String] = [
        "te-IN": "te-IN-Chirp3-HD-Achernar",
        "ta-IN": "ta-IN-Chirp3-HD-Achernar",
        "en-US": "en-US-Chirp3-HD-Achernar",
    ]

    static var isConfigured: Bool {
        !(UserDefaults.standard.string(forKey: "googleTTSAPIKey")?
            .trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ?? true)
    }

    /// Build (or fetch from cache) MP3 audio for the given chunk.
    func synthesize(text: String, languageCode: String, rate: Double = 0.92) async throws -> Data {
        guard let key = UserDefaults.standard.string(forKey: "googleTTSAPIKey")?
                .trimmingCharacters(in: .whitespacesAndNewlines),
              !key.isEmpty else {
            throw GoogleTTSError.notConfigured
        }
        let voice = Self.voice(for: languageCode)
        let cacheKey = cacheKey(text: text, lang: languageCode, voice: voice, rate: rate)
        if let cached = readCache(cacheKey) { return cached }

        var components = URLComponents(string: "https://texttospeech.googleapis.com/v1/text:synthesize")!
        components.queryItems = [URLQueryItem(name: "key", value: key)]
        var req = URLRequest(url: components.url!)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        struct Body: Encodable {
            struct Input: Encodable { let text: String }
            struct Voice: Encodable { let languageCode: String; let name: String }
            struct AudioConfig: Encodable { let audioEncoding: String; let speakingRate: Double }
            let input: Input
            let voice: Voice
            let audioConfig: AudioConfig
        }
        let body = Body(
            input: .init(text: text),
            voice: .init(languageCode: languageCode, name: voice),
            audioConfig: .init(audioEncoding: "MP3", speakingRate: rate)
        )
        req.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: req)
        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            let msg = String(data: data, encoding: .utf8) ?? "?"
            throw GoogleTTSError.http(http.statusCode, msg.prefix(400).description)
        }
        struct Resp: Decodable { let audioContent: String }
        let decoded = try JSONDecoder().decode(Resp.self, from: data)
        guard let mp3 = Data(base64Encoded: decoded.audioContent) else {
            throw GoogleTTSError.decode
        }
        writeCache(cacheKey, value: mp3)
        return mp3
    }

    /// Google rejects requests > 5000 bytes. Split on sentence boundaries.
    static func chunk(_ text: String, maxBytes: Int = 4500) -> [String] {
        let sentences = text.components(separatedBy: CharacterSet(charactersIn: "."))
            .flatMap { $0.components(separatedBy: "!") }
            .flatMap { $0.components(separatedBy: "?") }
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        var chunks: [String] = []
        var current = ""
        for s in sentences {
            let candidate = current.isEmpty ? s : "\(current). \(s)"
            if candidate.utf8.count > maxBytes {
                if !current.isEmpty { chunks.append("\(current).") }
                // Hard-split overly long sentence (rare).
                if s.utf8.count > maxBytes {
                    var rest = s
                    while rest.utf8.count > maxBytes {
                        let cut = rest.index(rest.startIndex, offsetBy: maxBytes / 3,
                                              limitedBy: rest.endIndex) ?? rest.endIndex
                        chunks.append(String(rest[..<cut]))
                        rest = String(rest[cut...])
                    }
                    current = rest
                } else {
                    current = s
                }
            } else {
                current = candidate
            }
        }
        if !current.isEmpty { chunks.append("\(current).") }
        return chunks
    }

    // MARK: - Helpers

    private static func voice(for languageCode: String) -> String {
        let key = "googleTTSVoice_\(languageCode.replacingOccurrences(of: "-", with: "_"))"
        if let custom = UserDefaults.standard.string(forKey: key),
           !custom.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return custom
        }
        return defaultVoices[languageCode] ?? defaultVoices["en-US"]!
    }

    private var cacheDir: URL? = {
        let fm = FileManager.default
        guard let base = fm.urls(for: .cachesDirectory, in: .userDomainMask).first else { return nil }
        let dir = base.appendingPathComponent("google-tts", isDirectory: true)
        try? fm.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }()

    private func cacheKey(text: String, lang: String, voice: String, rate: Double) -> String {
        let raw = "\(lang)|\(voice)|\(rate)|\(text)"
        let digest = SHA256.hash(data: Data(raw.utf8))
        return digest.compactMap { String(format: "%02x", $0) }.joined().prefix(40).description
    }

    private func readCache(_ key: String) -> Data? {
        guard let dir = cacheDir else { return nil }
        return try? Data(contentsOf: dir.appendingPathComponent("\(key).mp3"))
    }
    private func writeCache(_ key: String, value: Data) {
        guard let dir = cacheDir else { return }
        try? value.write(to: dir.appendingPathComponent("\(key).mp3"))
    }
}

enum GoogleTTSError: LocalizedError {
    case notConfigured
    case http(Int, String)
    case decode

    var errorDescription: String? {
        switch self {
        case .notConfigured: "Add a Google TTS API key in Settings to use the high-quality voice."
        case .http(let c, let m): "Google TTS \(c): \(m)"
        case .decode: "Couldn't decode TTS response."
        }
    }
}
