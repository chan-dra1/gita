package expo.modules.dharmablocker

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat

class DharmaForegroundService : Service() {
    private var isBlocking = false
    private var blockedApps = listOf<String>()
    private val handler = Handler(Looper.getMainLooper())
    private val checkInterval = 1500L // 1.5 seconds

    private val monitorRunnable = object : Runnable {
        override fun run() {
            if (isBlocking) {
                checkForegroundApp()
                handler.postDelayed(this, checkInterval)
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        createNotificationChannel()
        val notification = NotificationCompat.Builder(this, "DharmaChannel")
            .setContentTitle("🛡️ Dharma Mode Active")
            .setContentText("Protecting your spiritual focus...")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
        
        startForeground(1, notification)

        blockedApps = intent?.getStringArrayListExtra("blockedApps")?.toList() ?: emptyList()
        isBlocking = true
        handler.post(monitorRunnable)

        return START_STICKY
    }

    /**
     * Use UsageEvents for more accurate foreground app detection.
     * queryUsageStats can be inaccurate for real-time detection
     * because it reports aggregate stats, not current state.
     */
    private fun checkForegroundApp() {
        try {
            val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val time = System.currentTimeMillis()
            
            // Use UsageEvents for real-time accuracy instead of queryUsageStats
            val usageEvents = usageStatsManager.queryEvents(time - 5000, time)
            val event = UsageEvents.Event()
            var foregroundApp: String? = null

            // Walk through events — the last MOVE_TO_FOREGROUND event is the current foreground app
            while (usageEvents.hasNextEvent()) {
                usageEvents.getNextEvent(event)
                if (event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                    foregroundApp = event.packageName
                }
            }

            if (foregroundApp != null && blockedApps.contains(foregroundApp)) {
                // Blocked app detected! Bring our app to the front
                val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
                launchIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                launchIntent?.putExtra("route", "/dharma")
                startActivity(launchIntent)
            }
        } catch (e: SecurityException) {
            // Usage stats permission revoked — stop monitoring
            isBlocking = false
            handler.removeCallbacks(monitorRunnable)
        } catch (e: Exception) {
            // Other error — log and continue
            android.util.Log.w("DharmaService", "Error checking foreground app", e)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        isBlocking = false
        handler.removeCallbacks(monitorRunnable)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel("DharmaChannel", "Dharma Mode", NotificationManager.IMPORTANCE_LOW)
            channel.description = "Notification for active Dharma Mode app blocking"
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
}
