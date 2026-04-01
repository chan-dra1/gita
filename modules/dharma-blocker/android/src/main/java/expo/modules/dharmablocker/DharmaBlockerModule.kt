package expo.modules.dharmablocker

import android.content.Context
import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DharmaBlockerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DharmaBlocker")

    AsyncFunction("requestPermissions") { promise: expo.modules.kotlin.Promise ->
      val context = appContext.reactContext
      if (context == null) {
          promise.reject("ERR", "Context is null", null)
          return@AsyncFunction
      }
      // Request Usage Access
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      
      // Request Draw Overlay
      if (!Settings.canDrawOverlays(context)) {
          val overlayIntent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION)
          overlayIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          context.startActivity(overlayIntent)
      }
      promise.resolve(true)
    }

    Function("startBlocking") { apps: List<String> ->
      val context = appContext.reactContext
      if (context != null) {
        val intent = Intent(context, DharmaForegroundService::class.java)
        intent.putStringArrayListExtra("blockedApps", ArrayList(apps))
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
      }
    }

    AsyncFunction("getInstalledApps") { promise: expo.modules.kotlin.Promise ->
      val context = appContext.reactContext
      if (context == null) {
          promise.reject("ERR", "Context is null", null)
          return@AsyncFunction
      }
      val pm = context.packageManager
      val packages = pm.getInstalledPackages(0)
      val appList = mutableListOf<Map<String, String>>()
      
      for (pkg in packages) {
          // Filter out system apps that shouldn't be blocked, but keep user apps
          val isSystem = (pkg.applicationInfo?.flags ?: 0) and android.content.pm.ApplicationInfo.FLAG_SYSTEM != 0
          if (!isSystem || pkg.packageName == "com.android.chrome" || pkg.packageName == "com.google.android.youtube") {
              val appMap = mapOf(
                  "packageName" to pkg.packageName,
                  "label" to (pkg.applicationInfo?.loadLabel(pm)?.toString() ?: pkg.packageName)
              )
              appList.add(appMap)
          }
      }
      promise.resolve(appList)
    }

    Function("stopBlocking") {
      val context = appContext.reactContext
      if (context != null) {
        val intent = Intent(context, DharmaForegroundService::class.java)
        context.stopService(intent)
      }
    }
  }
}
