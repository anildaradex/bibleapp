import SwiftUI

struct InsightSheet: View {
    let reference: PassageReference
    let verses: [Verse]

    @Environment(\.dismiss) private var dismiss
    @State private var insight: PassageInsight?
    @State private var loading = true
    @State private var error: String?

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
        }
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
