package com.alphawolf.gita.widgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import com.alphawolf.gita.R

class VerseWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        private const val PREFS_NAME = "gita_widget"

        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val chapter = prefs.getInt("widget_chapter", 1)
            val verse = prefs.getInt("widget_verse", 1)
            val sanskrit = prefs.getString("widget_sanskrit", null)
                ?: "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः"
            val english = prefs.getString("widget_english", null)
                ?: "On the holy field of Kurukshetra..."

            val views = RemoteViews(context.packageName, R.layout.verse_widget)
            views.setTextViewText(
                R.id.widget_title,
                "CHAPTER $chapter · VERSE $verse"
            )
            views.setTextViewText(R.id.widget_sanskrit, sanskrit)
            views.setTextViewText(R.id.widget_english, english)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
