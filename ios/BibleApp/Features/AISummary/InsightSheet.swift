import SwiftUI

struct InsightSheet: View {
    let reference: PassageReference
    let verses: [Verse]

    @Environment(\.dismiss) private var dismiss
    @State private var insight: PassageInsight?
    @State private var loading = true
    @State private var error: String?
    @ObservedObject private var voice = VoiceService.shared

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if loading {
                        ProgressView("Gathering context...")
                            .frame(maxWidth: .infinity, alignment: .center)
                            .padding(.top, 64)
                    } else if let error {
                        Text(error).foregroundStyle(.red)
                    } else if let insight {
                        Group {
                            listenNotesBar(for: insight)
                            sectionHeader("Summary")
                            Text(insight.summary)

                            sectionHeader("Context")
                            Text(insight.context)

                            if !insight.crossReferences.isEmpty {
                                sectionHeader("Cross-references")
                                ForEach(insight.crossReferences, id: \.self) { ref in
                                    Text("• \(ref)")
                                }
                            }

                            sectionHeader("Sources")
                            ForEach(insight.citations, id: \.self) { c in
                                if let url = URL(string: c.sourceURL) {
                                    Link("\(c.author) — \(c.sourceURL)", destination: url)
                                        .font(.footnote)
                                }
                            }

                            Text("AI-generated study aid. Not Scripture. Verify against the text.")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .padding(.top, 24)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle(reference.display)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
            .task { await load() }
            .onDisappear { voice.stop() }
        }
    }

    @ViewBuilder
    private func listenNotesBar(for insight: PassageInsight) -> some View {
        let text = "\(reference.display). Summary. \(insight.summary) Context. \(insight.context)"
        HStack {
            switch voice.status {
            case .idle:
                Button {
                    voice.speak(text, languageCode: "en-US")
                } label: {
                    Label("Listen to notes", systemImage: "play.circle.fill")
                }
                .buttonStyle(.borderedProminent)
            case .loading:
                HStack(spacing: 8) {
                    ProgressView()
                    Text("Preparing voice…").foregroundStyle(.secondary)
                    Button { voice.stop() } label: {
                        Image(systemName: "xmark.circle.fill").foregroundStyle(.secondary)
                    }
                }
            case .speaking:
                Button { voice.pause() } label: {
                    Label("Pause", systemImage: "pause.circle.fill")
                }
                .buttonStyle(.bordered)
                Button { voice.stop() } label: {
                    Image(systemName: "stop.circle.fill")
                }
            case .paused:
                Button { voice.resume() } label: {
                    Label("Resume", systemImage: "play.circle.fill")
                }
                .buttonStyle(.borderedProminent)
                Button { voice.stop() } label: {
                    Image(systemName: "stop.circle.fill")
                }
            }
            Spacer()
        }
        .padding(.bottom, 4)
    }

    private func sectionHeader(_ text: String) -> some View {
        Text(text)
            .font(.headline)
            .padding(.top, 8)
    }

    private func load() async {
        do {
            insight = try await GemmaService.shared.insight(for: reference, verses: verses)
        } catch {
            self.error = error.localizedDescription
        }
        loading = false
    }
}
