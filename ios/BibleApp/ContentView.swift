import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            JourneyView()
                .tabItem { Label("Journey", systemImage: "flame.fill") }

            ReaderView()
                .tabItem { Label("Read", systemImage: "book.fill") }

            SearchView()
                .tabItem { Label("Search", systemImage: "magnifyingglass") }

            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape.fill") }
        }
    }
}

struct SettingsView: View {
    @AppStorage("dailyGoalMinutes") private var dailyGoalMinutes: Int = 15
    @AppStorage("preferredTranslation") private var translation: String = "KJV"
    @AppStorage("esvAPIKey") private var esvKey: String = ""
    @AppStorage("readerFontSize") private var fontSizeRaw: String = "normal"
    @State private var showingKeyEditor = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Reading") {
                    Picker("Translation", selection: $translation) {
                        ForEach(BibleService.shared.availableTranslations) { t in
                            let p = BibleService.shared.provider(for: t.id)
                            let suffix = (p?.isAvailable ?? true) ? "" : "  •  setup needed"
                            Text("\(t.id)\(suffix)").tag(t.id)
                        }
                    }
                    Stepper("Daily goal: \(dailyGoalMinutes) min",
                            value: $dailyGoalMinutes, in: 5...120, step: 5)
                    Picker("Text size", selection: $fontSizeRaw) {
                        ForEach(ReaderFontSize.allCases) { size in
                            Text(size.label).tag(size.rawValue)
                        }
                    }
                }

                Section("Translations") {
                    ForEach(BibleService.shared.availableTranslations) { t in
                        let p = BibleService.shared.provider(for: t.id)
                        VStack(alignment: .leading, spacing: 2) {
                            HStack {
                                Text("\(t.id) — \(t.name)").font(.subheadline)
                                Spacer()
                                if p?.isAvailable == true {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(.green)
                                } else {
                                    Image(systemName: "exclamationmark.circle.fill")
                                        .foregroundStyle(.orange)
                                }
                            }
                            Text(t.publisher)
                                .font(.caption).foregroundStyle(.secondary)
                            if let reason = p?.unavailabilityReason {
                                Text(reason)
                                    .font(.caption2)
                                    .foregroundStyle(.orange)
                                    .padding(.top, 2)
                            }
                        }
                    }
                    Button {
                        showingKeyEditor = true
                    } label: {
                        HStack {
                            Image(systemName: "key.fill")
                            Text(esvKey.isEmpty ? "Add ESV API key" : "Update ESV API key")
                        }
                    }
                    if !esvKey.isEmpty {
                        Text("ESV key on file: \(maskedKey(esvKey))")
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }

                Section("About") {
                    Text("Built on Biblical principles. AI summaries are study aids, not Scripture.")
                        .font(.footnote).foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Settings")
            .sheet(isPresented: $showingKeyEditor) {
                ESVKeyEditor(key: $esvKey)
            }
        }
    }

    private func maskedKey(_ k: String) -> String {
        guard k.count > 6 else { return String(repeating: "•", count: k.count) }
        let tail = k.suffix(4)
        return String(repeating: "•", count: k.count - 4) + tail
    }
}

private struct ESVKeyEditor: View {
    @Binding var key: String
    @Environment(\.dismiss) private var dismiss
    @State private var draft: String = ""

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    SecureField("Paste ESV API key", text: $draft)
                        .textContentType(.password)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                } header: {
                    Text("ESV API key")
                } footer: {
                    Text("Free for personal / non-commercial use. Sign up at api.esv.org and create an Application; the token will appear on its page. The key is stored on this device only.")
                }
                if let url = URL(string: "https://api.esv.org/account/create-application/") {
                    Link(destination: url) {
                        Label("Get a free key at api.esv.org", systemImage: "arrow.up.right.square")
                    }
                }
                if !key.isEmpty {
                    Button(role: .destructive) {
                        key = ""
                        dismiss()
                    } label: {
                        Label("Remove key from this device", systemImage: "trash")
                    }
                }
            }
            .navigationTitle("ESV API key")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        key = draft.trimmingCharacters(in: .whitespacesAndNewlines)
                        dismiss()
                    }
                    .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            .onAppear { draft = key }
        }
    }
}

#Preview { ContentView() }
