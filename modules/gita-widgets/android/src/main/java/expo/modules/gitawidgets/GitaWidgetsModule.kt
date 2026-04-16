package expo.modules.gitawidgets

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class GitaWidgetsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("GitaWidgets")

    val prefsName = "gita_widget"

    AsyncFunction("setWidgetData") { chapter: Int, verse: Int, sanskrit: String, english: String ->
      this@GitaWidgetsModule.persistAndBroadcast(chapter, verse, sanskrit, english, prefsName)
    }

    AsyncFunction("updateWidget") { chapter: Int, verse: Int, sanskrit: String, english: String ->
      this@GitaWidgetsModule.persistAndBroadcast(chapter, verse, sanskrit, english, prefsName)
    }
  }

  private fun persistAndBroadcast(
    chapter: Int,
    verse: Int,
    sanskrit: String,
    english: String,
    prefsName: String
  ) {
    val context = appContext.reactContext ?: return
    val prefs = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
    prefs.edit()
      .putInt("widget_chapter", chapter)
      .putInt("widget_verse", verse)
      .putString("widget_sanskrit", sanskrit)
      .putString("widget_english", english)
      .apply()

    val manager = AppWidgetManager.getInstance(context)
    val component = ComponentName(context, "com.alphawolf.gita.widgets.VerseWidget")
    val ids = manager.getAppWidgetIds(component)
    if (ids.isNotEmpty()) {
      val intent = Intent(context, Class.forName("com.alphawolf.gita.widgets.VerseWidget"))
      intent.action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
      intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
      context.sendBroadcast(intent)
    }
  }
}
