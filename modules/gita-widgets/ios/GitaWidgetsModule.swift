import ExpoModulesCore
import Foundation
import WidgetKit

private let appGroupId = "group.com.alphawolf.gita"
private let widgetKind = "VerseWidget"

public class GitaWidgetsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("GitaWidgets")

    AsyncFunction("setWidgetData") { (chapter: Int, verse: Int, sanskrit: String, english: String) in
      try GitaWidgetsModule.writeAndReload(chapter: chapter, verse: verse, sanskrit: sanskrit, english: english)
    }

    AsyncFunction("updateWidget") { (chapter: Int, verse: Int, sanskrit: String, english: String) in
      try GitaWidgetsModule.writeAndReload(chapter: chapter, verse: verse, sanskrit: sanskrit, english: english)
    }
  }

  private static func writeAndReload(chapter: Int, verse: Int, sanskrit: String, english: String) throws {
    guard let defaults = UserDefaults(suiteName: appGroupId) else {
      throw NSError(domain: "GitaWidgets", code: 1, userInfo: [NSLocalizedDescriptionKey: "App Group UserDefaults unavailable"])
    }
    defaults.set(chapter, forKey: "widget_chapter")
    defaults.set(verse, forKey: "widget_verse")
    defaults.set(sanskrit, forKey: "widget_sanskrit")
    defaults.set(english, forKey: "widget_english")
    defaults.synchronize()
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadTimelines(ofKind: widgetKind)
    }
  }
}
