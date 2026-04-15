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
        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.verse_widget)
            
            // Data is set by the Expo app using AppGroups/SharedPreferences
            // This is a placeholder for the production widget logic
            
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
