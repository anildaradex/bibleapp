import Foundation
import AVFoundation
import Combine

/// Thin wrapper over `AVSpeechSynthesizer` so the Reader and the Insight
/// sheet can read text aloud. Used by senior-parent listeners — defaults
/// to a slightly slower rate, and matches voice language to the active
/// translation (Telugu / Tamil voices come from iOS Settings →
/// Accessibility → Spoken Content if installed).
@MainActor
final class VoiceService: NSObject, ObservableObject, AVSpeechSynthesizerDelegate {
    static let shared = VoiceService()

    enum Status { case idle, speaking, paused }
    @Published private(set) var status: Status = .idle

    private let synth = AVSpeechSynthesizer()

    override init() {
        super.init()
        synth.delegate = self
    }

    /// Map a translation id to a BCP-47 language code that iOS uses
    /// to pick a voice.
    static func languageCode(for translationID: String) -> String {
        switch translationID.uppercased() {
        case "TAM": return "ta-IN"
        case "TEL": return "te-IN"
        default:    return "en-US"
        }
    }

    func speak(_ text: String, languageCode: String, rate: Float = 0.42) {
        // 0.5 is iOS default; 0.42 is gently slow and easy on senior listeners.
        synth.stopSpeaking(at: .immediate)
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = bestVoice(for: languageCode)
        utterance.rate = rate
        utterance.pitchMultiplier = 1.0
        utterance.preUtteranceDelay = 0.1
        synth.speak(utterance)
        status = .speaking
    }

    func pause() {
        synth.pauseSpeaking(at: .word)
        status = .paused
    }

    func resume() {
        synth.continueSpeaking()
        status = .speaking
    }

    func stop() {
        synth.stopSpeaking(at: .immediate)
        status = .idle
    }

    private func bestVoice(for code: String) -> AVSpeechSynthesisVoice? {
        if let exact = AVSpeechSynthesisVoice(language: code) { return exact }
        // Fall back to base language (te-IN → te), then default.
        let base = code.split(separator: "-").first.map(String.init) ?? code
        return AVSpeechSynthesisVoice.speechVoices()
            .first { $0.language.hasPrefix(base) }
    }

    // MARK: - AVSpeechSynthesizerDelegate

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer,
                                       didFinish utterance: AVSpeechUtterance) {
        Task { @MainActor in self.status = .idle }
    }
    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer,
                                       didCancel utterance: AVSpeechUtterance) {
        Task { @MainActor in self.status = .idle }
    }
}
