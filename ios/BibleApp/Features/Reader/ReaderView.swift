import SwiftUI
import SwiftData

struct ReaderView: View {
    @Environment(\.modelContext) private var context
    @AppStorage("preferredTranslation") private var translation: String = "KJV"
    @AppStorage("dailyGoalMinutes") private var goalMinutes: Int = 15
    @AppStorage("lastBookID") private var bookID: String = "JHN"
    @AppStorage("lastChapter") private var chapter: Int = 3

    @State private var verses: [Verse] = []
    @State private var selected: Set<Verse> = []
    @State private var session: ReadingSession?
    @State private var showingInsight = false
    @State private var showingPicker = false
    @State private var loadError: String?

    private var currentBook: Book { BibleBooks.book(id: bookID) ?? BibleBooks.all[43] }

    var body: some View {
        NavigationStack {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 12) {
                        if let provider = BibleService.shared.provider(for: translation),
                           !provider.isAvailable {
                            UnavailableTranslationCard(translation: provider.translation,
                                                       reason: provider.unavailabilityReason)
                                .padding(.top, 16)
                        } else if let loadError {
                            Text(loadError)
                                .font(.callout)
                                .foregroundStyle(.red)
                                .padding()
                        }
                        ForEach(verses) { verse in
                            HStack(alignment: .top, spacing: 8) {
                                Text("\(verse.verse)")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                                    .frame(width: 22, alignment: .trailing)
                                Text(verse.text)
                                    .font(.body)
                            }
                            .padding(.vertical, 4)
                            .padding(.horizontal, 8)
                            .background(selected.contains(verse)
                                        ? Color.yellow.opacity(0.25)
                                        : .clear)
                            .id(verse.id)
                            .onTapGesture {
                                if selected.contains(verse) { selected.remove(verse) }
                                else { selected.insert(verse) }
                            }
                        }
                        navigationFooter
                            .padding(.top, 24)
                    }
                    .padding()
                }
                .onChange(of: verses.count) { _, _ in
                    if let first = verses.first { proxy.scrollTo(first.id, anchor: .top) }
                }
            }
            .navigationTitle("\(currentBook.name) \(chapter)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        showingPicker = true
                    } label: {
                        Label("Pick", systemImage: "book")
                    }
                }
                ToolbarItem(placement: .principal) {
                    Text(translation).font(.caption).foregroundStyle(.secondary)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingInsight = true
                    } label: {
                        Label("Insight", systemImage: "sparkles")
                    }
                    .disabled(selected.isEmpty)
                }
            }
            .sheet(isPresented: $showingInsight) {
                if let ref = passageReferenceForSelection() {
                    InsightSheet(reference: ref, verses: Array(selected))
                }
            }
            .sheet(isPresented: $showingPicker) {
                BookChapterPicker(bookID: $bookID, chapter: $chapter)
                    .presentationDetents([.large])
            }
            .task(id: "\(translation)/\(bookID)/\(chapter)") {
                await loadChapter()
            }
            .onAppear {
                session = TrackerService.shared.startSession(context: context,
                                                              bookID: bookID,
                                                              chapter: chapter)
            }
            .onDisappear {
                if let session {
                    TrackerService.shared.endSession(session,
                                                     versesRead: verses.count,
                                                     context: context,
                                                     goalMinutes: goalMinutes)
                }
            }
        }
    }

    @ViewBuilder
    private var navigationFooter: some View {
        HStack {
            Button {
                goToPreviousChapter()
            } label: {
                Label("Previous", systemImage: "chevron.left")
            }
            .disabled(!canGoPrevious)
            Spacer()
            Button {
                goToNextChapter()
            } label: {
                Label("Next", systemImage: "chevron.right")
                    .labelStyle(.titleAndIcon)
            }
            .disabled(!canGoNext)
        }
        .padding(.horizontal, 8)
    }

    private var canGoPrevious: Bool {
        chapter > 1 || (BibleBooks.index(of: bookID) ?? 0) > 0
    }

    private var canGoNext: Bool {
        chapter < currentBook.chapterCount
            || (BibleBooks.index(of: bookID) ?? 65) < BibleBooks.all.count - 1
    }

    private func goToPreviousChapter() {
        if chapter > 1 {
            chapter -= 1
        } else if let i = BibleBooks.index(of: bookID), i > 0 {
            let prev = BibleBooks.all[i - 1]
            bookID = prev.id
            chapter = prev.chapterCount
        }
    }

    private func goToNextChapter() {
        if chapter < currentBook.chapterCount {
            chapter += 1
        } else if let i = BibleBooks.index(of: bookID), i < BibleBooks.all.count - 1 {
            bookID = BibleBooks.all[i + 1].id
            chapter = 1
        }
    }

    private func loadChapter() async {
        selected.removeAll()
        loadError = nil
        // Skip network if the translation isn't configured (e.g. ESV with no key).
        if let provider = BibleService.shared.provider(for: translation),
           !provider.isAvailable {
            verses = []
            return
        }
        do {
            verses = try await BibleService.shared.chapter(translationID: translation,
                                                           bookID: bookID,
                                                           chapter: chapter)
        } catch {
            verses = []
            loadError = error.localizedDescription
        }
    }

    private func passageReferenceForSelection() -> PassageReference? {
        let sorted = selected.sorted { $0.verse < $1.verse }
        guard let first = sorted.first, let last = sorted.last else { return nil }
        return PassageReference(bookID: bookID, chapter: chapter,
                                startVerse: first.verse, endVerse: last.verse)
    }
}

private struct BookChapterPicker: View {
    @Binding var bookID: String
    @Binding var chapter: Int
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section("Old Testament") {
                    ForEach(BibleBooks.all.filter { $0.testament == .old }) { book in
                        bookRow(book)
                    }
                }
                Section("New Testament") {
                    ForEach(BibleBooks.all.filter { $0.testament == .new }) { book in
                        bookRow(book)
                    }
                }
            }
            .navigationTitle("Books")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    private func bookRow(_ book: Book) -> some View {
        NavigationLink {
            ChapterGrid(book: book) { picked in
                bookID = book.id
                chapter = picked
                dismiss()
            }
        } label: {
            HStack {
                Text(book.name)
                Spacer()
                if book.id == bookID {
                    Image(systemName: "checkmark").foregroundStyle(.tint)
                }
            }
        }
    }
}

private struct ChapterGrid: View {
    let book: Book
    let onPick: (Int) -> Void

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 8), count: 5)

    var body: some View {
        ScrollView {
            LazyVGrid(columns: columns, spacing: 8) {
                ForEach(1...book.chapterCount, id: \.self) { c in
                    Button { onPick(c) } label: {
                        Text("\(c)")
                            .font(.headline)
                            .frame(maxWidth: .infinity, minHeight: 44)
                            .background(Color.accentColor.opacity(0.15))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding()
        }
        .navigationTitle(book.name)
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct UnavailableTranslationCard: View {
    let translation: Translation
    let reason: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("\(translation.id) needs setup", systemImage: "key.fill")
                .font(.headline)
            if let reason {
                Text(reason).font(.callout).foregroundStyle(.secondary)
            }
            Text("Open the Settings tab → Translations → \"Add ESV API key\".")
                .font(.caption).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.orange.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }
}

#Preview { ReaderView() }
