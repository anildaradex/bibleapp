import SwiftUI

struct SearchView: View {
    @AppStorage("preferredTranslation") private var translation: String = "NKJV"
    @State private var query: String = ""
    @State private var results: [Verse] = []

    var body: some View {
        NavigationStack {
            List(results) { verse in
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(verse.bookID) \(verse.chapter):\(verse.verse)")
                        .font(.caption).foregroundStyle(.secondary)
                    Text(verse.text)
                }
            }
            .overlay {
                if results.isEmpty {
                    ContentUnavailableView("Search Scripture",
                                           systemImage: "magnifyingglass",
                                           description: Text("Enter a reference (e.g. John 3:16) or a keyword."))
                }
            }
            .searchable(text: $query, prompt: "Reference or keyword")
            .onSubmit(of: .search) { Task { await runSearch() } }
            .navigationTitle("Search")
        }
    }

    private func runSearch() async {
        do {
            results = try await BibleService.shared.search(translationID: translation, query: query)
        } catch {
            results = []
        }
    }
}

#Preview { SearchView() }
