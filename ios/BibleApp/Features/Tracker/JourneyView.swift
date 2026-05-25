import SwiftUI
import SwiftData

struct JourneyView: View {
    @Environment(\.modelContext) private var context
    @AppStorage("dailyGoalMinutes") private var goalMinutes: Int = 15

    @Query(sort: \JourneyMeter.dayKey, order: .reverse) private var meters: [JourneyMeter]

    private var today: JourneyMeter? {
        meters.first { $0.dayKey == TrackerService.dayKey() }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    MeterRing(progress: today?.progress ?? 0,
                              minutes: today?.minutesInWord ?? 0,
                              goal: goalMinutes)
                        .frame(width: 220, height: 220)
                        .padding(.top, 32)

                    Text("Streak: \(TrackerService.shared.currentStreak(context: context)) days")
                        .font(.headline)

                    Text("\"Your word is a lamp to my feet and a light to my path.\" — Psalm 119:105")
                        .font(.callout)
                        .italic()
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.secondary)
                        .padding(.horizontal)

                    WeeklyHeatmap(meters: Array(meters.prefix(28)))
                        .padding(.horizontal)
                }
            }
            .navigationTitle("Journey")
        }
    }
}

private struct MeterRing: View {
    let progress: Double
    let minutes: Double
    let goal: Int

    var body: some View {
        ZStack {
            Circle().stroke(Color.secondary.opacity(0.2), lineWidth: 18)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(.tint, style: StrokeStyle(lineWidth: 18, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.easeOut, value: progress)
            VStack {
                Text("\(Int(minutes)) / \(goal)")
                    .font(.system(size: 40, weight: .semibold, design: .rounded))
                Text("min in the Word today")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

private struct WeeklyHeatmap: View {
    let meters: [JourneyMeter]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Last 4 weeks").font(.subheadline).foregroundStyle(.secondary)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 4), count: 7), spacing: 4) {
                ForEach(meters) { meter in
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.accentColor.opacity(0.15 + 0.85 * meter.progress))
                        .aspectRatio(1, contentMode: .fit)
                }
            }
        }
    }
}

#Preview { JourneyView() }
