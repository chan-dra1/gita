package expo.modules.dharmablocker

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
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
    private val checkInterval = 1000L // 1 second

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
            .setContentTitle("Dharma Mode Active")
            .setContentText("Protecting your peace...")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .build()
        
        startForeground(1, notification)

        blockedApps = intent?.getStringArrayListExtra("blockedApps")?.toList() ?: emptyList()
        isBlocking = true
        handler.post(monitorRunnable)

        return START_STICKY
    }

    private fun checkForegroundApp() {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val time = System.currentTimeMillis()
        val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, time - 1000 * 10, time)
        
        val foregroundApp = stats.maxByOrNull { it.lastTimeUsed }?.packageName

        if (blockedApps.contains(foregroundApp)) {
            // App is blocked! Launch our app to the front
            val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
            launchIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            // Route to dharma mode screen via deep link if configured
            launchIntent?.putExtra("route", "/dharma")
            startActivity(launchIntent)
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
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
}
