import Foundation
import AVFoundation
import Combine

/// Speaks text aloud. Two backends, picked at speak() time:
///
///   1. Google Cloud TTS (when GoogleTTSService.isConfigured) — much
///      better Telugu / Tamil / English voices. Synthesizes each chunk
///      to MP3 on the server, plays them sequentially via AVAudioPlayer.
///      Caches per (text + lang + voice) so re-reads are instant.
///
///   2. AVSpeechSynthesizer — system fallback. Mechanical but offline.
@MainActor
final class VoiceService: NSObject, ObservableObject {
    static let shared = VoiceService()

    enum Status { case idle, loading, speaking, paused }
    @Published private(set) var status: Status = .idle

    private let synth = AVSpeechSynthesizer()
    private var player: AVAudioPlayer?
    private var queue: [Data] = []          // remaining MP3 chunks
    private var cancelled = false
    private var delegate: SynthDelegate?
    private var playerDelegate: PlayerDelegate?

    override init() {
        super.init()
        delegate = SynthDelegate(owner: self)
        synth.delegate = delegate
        playerDelegate = PlayerDelegate(owner: self)
    }

    static func languageCode(for translationID: String) -> String {
        switch translationID.uppercased() {
        case "TAM": return "ta-IN"
        case "TEL": return "te-IN"
        default:    return "en-US"
        }
    }

    func speak(_ text: String, languageCode: String, rate: Float = 0.42) {
        stop()
        cancelled = false
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        if GoogleTTSService.isConfigured {
            status = .loading
            Task { await self.cloudSpeak(text: trimmed, languageCode: languageCode) }
        } else {
            localSpeak(trimmed, languageCode: languageCode, rate: rate)
        }
    }

    func pause() {
        if let p = player, p.isPlaying { p.pause(); status = .paused; return }
        if synth.isSpeaking { synth.pauseSpeaking(at: .word); status = .paused }
    }

    func resume() {
        if let p = player, !p.isPlaying { p.play(); status = .speaking; return }
        if synth.isPaused { synth.continueSpeaking(); status = .speaking }
    }

    func stop() {
        cancelled = true
        player?.stop()
        player = nil
        queue.removeAll()
        if synth.isSpeaking || synth.isPaused {
            synth.stopSpeaking(at: .immediate)
        }
        status = .idle
    }

    // MARK: - Cloud path

    private func cloudSpeak(text: String, languageCode: String) async {
        let chunks = GoogleTTSService.chunk(text)
        var audios: [Data] = []
        do {
            for chunk in chunks {
                if cancelled { return }
                let audio = try await GoogleTTSService.shared.synthesize(
                    text: chunk, languageCode: languageCode)
                audios.append(audio)
            }
        } catch {
            // Cloud failed (network / quota / bad key) — fall back to system voice.
            print("[VoiceService] Google TTS failed, falling back: \(error)")
            localSpeak(text, languageCode: languageCode, rate: 0.42)
            return
        }
        if cancelled { return }
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio)
        try? AVAudioSession.sharedInstance().setActive(true)
        queue = audios
        playNext()
    }

    private func playNext() {
        guard !queue.isEmpty else { status = .idle; return }
        let data = queue.removeFirst()
        do {
            player = try AVAudioPlayer(data: data)
            player?.delegate = playerDelegate
            player?.prepareToPlay()
            player?.play()
            status = .speaking
        } catch {
            print("[VoiceService] AVAudioPlayer error: \(error)")
            status = .idle
        }
    }

    fileprivate func chunkDidFinish() {
        if cancelled { return }
        if !queue.isEmpty { playNext() }
        else { status = .idle }
    }

    // MARK: - Local fallback

    private func localSpeak(_ text: String, languageCode: String, rate: Float) {
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = bestVoice(for: languageCode)
        utterance.rate = rate
        utterance.pitchMultiplier = 1.0
        utterance.preUtteranceDelay = 0.1
        synth.speak(utterance)
        status = .speaking
    }

    private func bestVoice(for code: String) -> AVSpeechSynthesisVoice? {
        if let exact = AVSpeechSynthesisVoice(language: code) { return exact }
        let base = code.split(separator: "-").first.map(String.init) ?? code
        return AVSpeechSynthesisVoice.speechVoices().first { $0.language.hasPrefix(base) }
    }

    fileprivate func systemSpeechFinished() { status = .idle }
}

// AVAudioPlayerDelegate + AVSpeechSynthesizerDelegate live as nested
// classes so VoiceService can stay @MainActor-clean.

private final class PlayerDelegate: NSObject, AVAudioPlayerDelegate {
    weak var owner: VoiceService?
    init(owner: VoiceService) { self.owner = owner }
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully _: Bool) {
        Task { @MainActor in owner?.chunkDidFinish() }
    }
}

private final class SynthDelegate: NSObject, AVSpeechSynthesizerDelegate {
    weak var owner: VoiceService?
    init(owner: VoiceService) { self.owner = owner }
    func speechSynthesizer(_ s: AVSpeechSynthesizer, didFinish u: AVSpeechUtterance) {
        Task { @MainActor in owner?.systemSpeechFinished() }
    }
    func speechSynthesizer(_ s: AVSpeechSynthesizer, didCancel u: AVSpeechUtterance) {
        Task { @MainActor in owner?.systemSpeechFinished() }
    }
}
