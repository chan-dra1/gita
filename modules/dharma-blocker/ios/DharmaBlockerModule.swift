import ExpoModulesCore
import Foundation
import SwiftUI
import UIKit
import FamilyControls
import ManagedSettings

private let familySelectionDefaultsKey = "dharma_family_selection_b64"

@available(iOS 16.0, *)
private enum DharmaShieldStore {
  static let store = ManagedSettingsStore()
}

private func topViewController(from root: UIViewController) -> UIViewController {
  if let presented = root.presentedViewController {
    return topViewController(from: presented)
  }
  if let nav = root as? UINavigationController, let visible = nav.visibleViewController {
    return topViewController(from: visible)
  }
  if let tab = root as? UITabBarController, let selected = tab.selectedViewController {
    return topViewController(from: selected)
  }
  return root
}

private func presenterViewController() -> UIViewController? {
  guard
    let scene = UIApplication.shared.connectedScenes
      .compactMap({ $0 as? UIWindowScene })
      .first(where: { $0.activationState == .foregroundActive || $0.activationState == .foregroundInactive }),
    let root = scene.keyWindow?.rootViewController
  else {
    return UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .first?
      .windows
      .first(where: \.isKeyWindow)?
      .rootViewController
      .map { topViewController(from: $0) }
  }
  return topViewController(from: root)
}

// MARK: - SwiftUI picker

@available(iOS 16.0, *)
private struct FamilyActivityPickerHost: View {
  @State private var selection = FamilyActivitySelection()
  let onFinish: (FamilyActivitySelection?) -> Void

  var body: some View {
    NavigationStack {
      FamilyActivityPicker(selection: $selection)
        .navigationTitle("Choose apps")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
          ToolbarItem(placement: .cancellationAction) {
            Button("Cancel") {
              onFinish(nil)
            }
          }
          ToolbarItem(placement: .confirmationAction) {
            Button("Save") {
              onFinish(selection)
            }
          }
        }
    }
  }
}

public class DharmaBlockerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DharmaBlocker")

    Function("hasUsagePermission") { () -> Bool in
      if #available(iOS 16.0, *) {
        return AuthorizationCenter.shared.authorizationStatus == .approved
      }
      return false
    }

    AsyncFunction("getAuthorizationStatus") { (promise: Promise) in
      if #available(iOS 16.0, *) {
        switch AuthorizationCenter.shared.authorizationStatus {
        case .notDetermined:
          promise.resolve("notDetermined")
        case .denied:
          promise.resolve("denied")
        case .approved:
          promise.resolve("approved")
        @unknown default:
          promise.resolve("unknown")
        }
      } else {
        promise.resolve("unsupported")
      }
    }

    AsyncFunction("requestPermissions") { (promise: Promise) in
      if #available(iOS 16.0, *) {
        let center = AuthorizationCenter.shared
        Task {
          do {
            try await center.requestAuthorization(for: .individual)
            promise.resolve(AuthorizationCenter.shared.authorizationStatus == .approved)
          } catch {
            print("Family controls authorization failed: \(error)")
            promise.reject("AUTH_FAILED", "Failed to authorize Family Controls. Ensure the Family Controls entitlement is enabled for this app.")
          }
        }
      } else {
        promise.reject("UNSUPPORTED_IOS", "Family Controls requires iOS 16+")
      }
    }

    AsyncFunction("setFamilySelectionBase64") { (base64: String?, promise: Promise) in
      guard let base64 = base64, !base64.isEmpty else {
        UserDefaults.standard.removeObject(forKey: familySelectionDefaultsKey)
        promise.resolve(nil)
        return
      }
      UserDefaults.standard.set(base64, forKey: familySelectionDefaultsKey)
      promise.resolve(true)
    }

    AsyncFunction("clearFamilySelection") { (promise: Promise) in
      UserDefaults.standard.removeObject(forKey: familySelectionDefaultsKey)
      promise.resolve(nil)
    }

    Function("hasFamilySelection") { () -> Bool in
      guard let b64 = UserDefaults.standard.string(forKey: familySelectionDefaultsKey),
            !b64.isEmpty,
            let data = Data(base64Encoded: b64) else {
        return false
      }
      if #available(iOS 16.0, *) {
        if let selection = try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data) {
          return !selection.applicationTokens.isEmpty
            || !selection.categoryTokens.isEmpty
            || !selection.webDomainTokens.isEmpty
        }
      }
      return false
    }

    AsyncFunction("presentFamilyActivityPicker") { (promise: Promise) in
      if #available(iOS 16.0, *) {
        DispatchQueue.main.async {
          guard let presenter = presenterViewController() else {
            promise.reject("NO_WINDOW", "Could not find a view controller to present the app picker.")
            return
          }

          let host = UIHostingController(
            rootView: FamilyActivityPickerHost { picked in
              presenter.dismiss(animated: true) {
                if let picked = picked {
                  do {
                    let data = try PropertyListEncoder().encode(picked)
                    promise.resolve(data.base64EncodedString())
                  } catch {
                    promise.reject("ENCODE_FAILED", error.localizedDescription)
                  }
                } else {
                  promise.resolve(NSNull())
                }
              }
            }
          )
          host.modalPresentationStyle = .pageSheet
          presenter.present(host, animated: true)
        }
      } else {
        promise.reject("UNSUPPORTED_IOS", "Family Controls requires iOS 16+")
      }
    }

    // Bundle IDs are ignored on iOS; shields follow the saved FamilyActivitySelection.
    Function("startBlocking") { (apps: [String]) in
      if #available(iOS 16.0, *) {
        guard let b64 = UserDefaults.standard.string(forKey: familySelectionDefaultsKey),
              let data = Data(base64Encoded: b64) else {
          print("[DharmaBlocker] iOS: No saved FamilyActivitySelection. Use the picker first.")
          return
        }
        do {
          let selection = try PropertyListDecoder().decode(FamilyActivitySelection.self, from: data)
          guard !selection.applicationTokens.isEmpty
            || !selection.categoryTokens.isEmpty
            || !selection.webDomainTokens.isEmpty else {
            print("[DharmaBlocker] iOS: Empty FamilyActivitySelection; pick at least one app, category, or website.")
            return
          }
          DharmaShieldStore.store.shield.applications = selection.applicationTokens
          if !selection.webDomainTokens.isEmpty {
            DharmaShieldStore.store.shield.webDomains = selection.webDomainTokens
          } else {
            DharmaShieldStore.store.shield.webDomains = nil
          }
          if !selection.categoryTokens.isEmpty {
            DharmaShieldStore.store.shield.applicationCategories = .specific(selection.categoryTokens)
          } else {
            DharmaShieldStore.store.shield.applicationCategories = nil
          }
        } catch {
          print("[DharmaBlocker] iOS: Failed to decode selection: \(error)")
        }
      }
    }

    Function("stopBlocking") {
      if #available(iOS 16.0, *) {
        DharmaShieldStore.store.clearAllSettings()
      }
    }

    AsyncFunction("getInstalledApps") { (promise: Promise) in
      promise.resolve([])
    }
  }
}
