package expo.modules.dharmablocker

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DharmaBlockerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DharmaBlocker")

    // Check if Usage Access permission is actually granted
    Function("hasUsagePermission") {
      val context = appContext.reactContext ?: return@Function false
      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName
      )
      mode == AppOpsManager.MODE_ALLOWED
    }

    AsyncFunction("requestPermissions") {
      val context = appContext.reactContext
        ?: throw Exception("Context is null")

      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val usageGranted = appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName
      ) == AppOpsManager.MODE_ALLOWED

      // Only open settings if not already granted
      if (!usageGranted) {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
      
      // Check overlay permission
      if (!Settings.canDrawOverlays(context)) {
        val overlayIntent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION)
        overlayIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(overlayIntent)
      }

      // Return actual status
      usageGranted && Settings.canDrawOverlays(context)
    }

    Function("startBlocking") { apps: List<String> ->
      val context = appContext.reactContext
      if (context != null) {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val usageGranted = appOps.checkOpNoThrow(
          AppOpsManager.OPSTR_GET_USAGE_STATS,
          Process.myUid(),
          context.packageName
        ) == AppOpsManager.MODE_ALLOWED

        if (usageGranted) {
          val intent = Intent(context, DharmaForegroundService::class.java)
          intent.putStringArrayListExtra("blockedApps", ArrayList(apps))
          if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
              context.startForegroundService(intent)
          } else {
              context.startService(intent)
          }
        }
      }
    }

    AsyncFunction("getInstalledApps") {
      val context = appContext.reactContext
        ?: throw Exception("Context is null")

      val pm = context.packageManager
      val packages = pm.getInstalledPackages(0)
      val appList = mutableListOf<Map<String, String>>()
      
      val commonDistractions = setOf(
          "com.instagram.android",
          "com.zhiliaoapp.musically",
          "com.google.android.youtube",
          "com.facebook.katana",
          "com.twitter.android",
          "com.reddit.frontpage",
          "com.snapchat.android",
          "com.whatsapp",
          "com.discord",
          "com.pinterest",
          "com.linkedin.android",
          "com.android.chrome",
          "org.telegram.messenger"
      )

      for (pkg in packages) {
          val isSystem = (pkg.applicationInfo?.flags ?: 0) and android.content.pm.ApplicationInfo.FLAG_SYSTEM != 0
          val isDistraction = commonDistractions.contains(pkg.packageName)
          if (!isSystem || isDistraction) {
              val appMap = mapOf(
                  "packageName" to pkg.packageName,
                  "label" to (pkg.applicationInfo?.loadLabel(pm)?.toString() ?: pkg.packageName)
              )
              appList.add(appMap)
          }
      }
      appList
    }

    Function("stopBlocking") {
      val context = appContext.reactContext
      if (context != null) {
        val intent = Intent(context, DharmaForegroundService::class.java)
        context.stopService(intent)
      }
    }

    // iOS Family Controls APIs — no-ops on Android so JS can call a single surface.
    AsyncFunction("getAuthorizationStatus") {
      "unsupported"
    }

    Function("hasFamilySelection") {
      false
    }

    AsyncFunction("presentFamilyActivityPicker") {
      null
    }

    AsyncFunction("setFamilySelectionBase64") { _: String? ->
      null
    }

    AsyncFunction("clearFamilySelection") {
      null
    }
  }
}
