package com.alphawolf.gita.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
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
            
            // Read from SharedPreferences populated by Expo Native Module
            val prefs = context.getSharedPreferences("gita_widget", Context.MODE_PRIVATE)
            val chapter = prefs.getInt("widget_chapter", 1)
            val verse = prefs.getInt("widget_verse", 1)
            val sanskrit = prefs.getString("widget_sanskrit", "धर्मक्षेत्रे कुरुक्षेत्रे...")
            val english = prefs.getString("widget_english", "Dhritarashtra said: O Sanjay...")
            
            views.setTextViewText(R.id.widget_title, "CHAPTER $chapter · VERSE $verse")
            views.setTextViewText(R.id.widget_sanskrit, sanskrit)
            views.setTextViewText(R.id.widget_english, english)
            
            // Deep Link to Meditation Player
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("gita://meditation?chapter=$chapter&verse=$verse"))
            intent.setPackage(context.packageName)
            val pendingIntent = PendingIntent.getActivity(
                context, 
                0, 
                intent, 
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            // Attach click listener to the entire widget layout (assuming a root ID if exists)
            // Or just attach to the text views
            views.setOnClickPendingIntent(R.id.widget_sanskrit, pendingIntent)
            views.setOnClickPendingIntent(R.id.widget_english, pendingIntent)
            views.setOnClickPendingIntent(R.id.widget_title, pendingIntent)
            
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
