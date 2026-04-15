import WidgetKit
import SwiftUI

struct VerseEntry: TimelineEntry {
    let date: Date
    let chapter: Int
    let verse: Int
    let sanskrit: String
    let english: String
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> VerseEntry {
        VerseEntry(date: Date(), chapter: 1, verse: 1, sanskrit: "धृतराष्ट्र उवाच |", english: "Dhritarashtra said...")
    }

    func getSnapshot(in context: Context, completion: @escaping (VerseEntry) -> ()) {
        let entry = getEntryFromStorage()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let entry = getEntryFromStorage()
        let timeline = Timeline(entries: [entry], policy: .atEnd)
        completion(timeline)
    }

    private func getEntryFromStorage() -> VerseEntry {
        let defaults = UserDefaults(suiteName: "group.com.alphawolf.gita")
        let chapter = defaults?.integer(forKey: "widget_chapter") ?? 1
        let verse = defaults?.integer(forKey: "widget_verse") ?? 1
        let sanskrit = defaults?.string(forKey: "widget_sanskrit") ?? "धर्मक्षेत्रे कुरुक्षेत्रे..."
        let english = defaults?.string(forKey: "widget_english") ?? "On the holy field of Kurukshetra..."
        
        return VerseEntry(
            date: Date(),
            chapter: chapter,
            verse: verse,
            sanskrit: sanskrit,
            english: english
        )
    }
}

struct VerseWidgetEntryView : View {
    var entry: VerseEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        ZStack {
            Color(hex: "#0D0D0D").ignoresSafeArea()
            
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("CHAPTER \(entry.chapter) · VERSE \(entry.verse)")
                        .font(.system(size: 10, weight: .bold))
                        .kerning(1.5)
                        .foregroundColor(Color(hex: "#D4A44C"))
                    Spacer()
                    Image(systemName: "sparkles")
                        .foregroundColor(Color(hex: "#D4A44C"))
                        .font(.system(size: 10))
                }
                
                Text(entry.sanskrit)
                    .font(.custom("Georgia", size: family == .systemSmall ? 16 : 20))
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .lineLimit(family == .systemSmall ? 3 : 5)
                    .minimumScaleFactor(0.7)
                
                if family != .systemSmall {
                    Divider()
                        .background(Color(hex: "#222"))
                        .padding(.vertical, 4)
                    
                    Text(entry.english)
                        .font(.custom("Georgia-Italic", size: 14))
                        .foregroundColor(Color(hex: "#9CA3AF"))
                        .lineLimit(4)
                        .minimumScaleFactor(0.8)
                }
                
                Spacer()
            }
            .padding(16)
        }
    }
}

@main
struct VerseWidget: Widget {
    let kind: String = "VerseWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            VerseWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Gita Daily Verse")
        .description("Daily spiritual wisdom on your home screen.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255, opacity: Double(a) / 255)
    }
}
