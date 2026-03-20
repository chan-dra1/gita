import ExpoModulesCore

import ExpoModulesCore
import FamilyControls
import ManagedSettings

public class DharmaBlockerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DharmaBlocker")

    AsyncFunction("requestPermissions") { (promise: Promise) in
      if #available(iOS 16.0, *) {
          let center = AuthorizationCenter.shared
          Task {
              do {
                  // This requires the com.apple.developer.family-controls entitlement
                  try await center.requestAuthorization(for: .individual)
                  promise.resolve(true)
              } catch {
                  print("Family controls authorization failed: \(error)")
                  promise.reject("AUTH_FAILED", "Failed to authorize Family Controls. Ensure entitlements are granted by Apple.")
              }
          }
      } else {
          promise.reject("UNSUPPORTED_IOS", "Family Controls requires iOS 16+")
      }
    }

    Function("startBlocking") { (apps: [String]) in
      if #available(iOS 16.0, *) {
          let _ = ManagedSettingsStore()
          // Note: In a real app, you use FamilyActivitySelection to let the user pick apps.
          // You cannot programmatically pass bundle IDs like "com.burbn.instagram" without the user picking them via the UI due to Apple's strict privacy policies.
          // store.shield.applications = ... (Tokens mapped from FamilyActivitySelection)
      }
    }

    Function("stopBlocking") {
      if #available(iOS 16.0, *) {
          let store = ManagedSettingsStore()
          store.clearAllSettings()
      }
    }
  }
}
