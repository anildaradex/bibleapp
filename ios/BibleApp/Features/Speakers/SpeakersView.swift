import SwiftUI
import SafariServices

/// Curated list of trusted preachers. Tapping a card opens the YouTube
/// channel inside an in-app Safari sheet — no app-switch to YouTube, so
/// it feels native to senior users.
struct SpeakersView: View {
    @State private var openURL: URL?

    private let speakers: [Speaker] = [
        Speaker(
            name: "Bro. John Wesley",
            tagline: "Calvary Temple, Hyderabad",
            language: "Telugu",
            description: "Telugu preacher and founder of Calvary Temple, Hyderabad. Daily messages in Telugu, often with English subtitles.",
            channelURL: URL(string: "https://www.youtube.com/@CalvaryTempleIndiaOfficial")!,
            searchQuery: "Bro John Wesley Calvary Temple Telugu sermon"
        ),
        Speaker(
            name: "Billy Graham",
            tagline: "Billy Graham Evangelistic Association",
            language: "English",
            description: "America's pastor (1918–2018). The BGEA channel hosts a deep archive of his crusade sermons.",
            channelURL: URL(string: "https://www.youtube.com/@BillyGrahamEvangelisticAssociation")!,
            searchQuery: "Billy Graham classic sermon"
        ),
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Sermons from preachers we trust. Tap a card to watch on YouTube.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .padding(.horizontal)

                    ForEach(speakers) { s in
                        SpeakerCard(speaker: s) { url in openURL = url }
                            .padding(.horizontal)
                    }

                    Text("Videos are hosted on YouTube. BibleApp does not control their content.")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .padding()
                }
                .padding(.vertical)
            }
            .navigationTitle("Speakers")
            .sheet(item: $openURL) { url in
                SafariView(url: url).ignoresSafeArea()
            }
        }
    }
}

private struct Speaker: Identifiable {
    let name: String
    let tagline: String
    let language: String
    let description: String
    let channelURL: URL
    let searchQuery: String
    var id: String { name }
    var searchURL: URL {
        var c = URLComponents(string: "https://www.youtube.com/results")!
        c.queryItems = [URLQueryItem(name: "search_query", value: searchQuery)]
        return c.url!
    }
}

private struct SpeakerCard: View {
    let speaker: Speaker
    let onOpen: (URL) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                Text(speaker.name).font(.title2).fontWeight(.semibold)
                Text("\(speaker.tagline) · \(speaker.language)")
                    .font(.footnote).foregroundStyle(.secondary)
            }

            Text(speaker.description).font(.body)

            HStack(spacing: 12) {
                Button {
                    onOpen(speaker.channelURL)
                } label: {
                    Label("Watch on YouTube", systemImage: "play.rectangle.fill")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 4)
                }
                .buttonStyle(.borderedProminent)

                Button {
                    onOpen(speaker.searchURL)
                } label: {
                    Label("More", systemImage: "magnifyingglass")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 4)
                }
                .buttonStyle(.bordered)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

extension URL: Identifiable {
    public var id: String { absoluteString }
}

private struct SafariView: UIViewControllerRepresentable {
    let url: URL
    func makeUIViewController(context: Context) -> SFSafariViewController {
        SFSafariViewController(url: url)
    }
    func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}
}

#Preview { SpeakersView() }
