# Store Launch Checklist — Gita Pro

Everything you need to submit to the App Store, Play Store, and Vercel for web. Tick through top-to-bottom.

---

## 0 · Final code hygiene

- Bump `expo.version` in `app.json` to the version you're submitting (Apple + Play see this in the metadata).
- Bump `expo.android.versionCode` by 1 for every Play submission (current: `4`).
- Confirm `expo.ios.bundleIdentifier = com.alphawolf.gita` matches App Store Connect.
- `eas build --platform ios --profile production` succeeds.
- `eas build --platform android --profile production` succeeds (AAB output, not APK).
- Web build: `npm run build` produces a clean `dist/` under 30 MB.
- `EXPO_PUBLIC_*` secrets are set in Expo project secrets (not in `eas.json`).
- Vercel env vars set: `GEMINI_API_KEY`, `CLAUDE_API_KEY`, `TTS_API_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`.
- `firebase-service-account.json` and `gita-app-390d7-firebase-adminsdk-fbsvc-*.json` are in `.gitignore` **and** `.vercelignore` **and** `.easignore` (verify: `git ls-files | grep firebase-adminsdk` returns nothing).

---

## 1 · Apple App Store

### 1.1 App Store Connect record

- App name: **Daily Bhagavad Gita** (30 char limit).
- Subtitle: 30 char pitch, e.g. **"Vedic wisdom, ad-free."**
- Primary category: **Education**. Secondary: **Lifestyle**.
- Content rights declaration ticked — confirm you have the right to ship the scripture, word-meanings, and purports per `src/data/SOURCE_AUDIT.md`.
- Age rating: **4+** (no content warnings apply).
- Price tier: Free (with IAP).

### 1.2 `Info.plist` / entitlements (via `app.json`)

- `NSUserNotificationsUsageDescription` — "Daily reminders to keep your sloka practice."
- `NSUserTrackingUsageDescription` — only needed if you add attribution SDKs. Skip until you do.
- `UIBackgroundModes` — none required for current features; do **not** include `audio` unless you ship true background playback.
- Add to `app.json → expo.ios.infoPlist`:

```json
"infoPlist": {
  "ITSAppUsesNonExemptEncryption": false,
  "NSUserNotificationsUsageDescription": "Daily reminders to keep your sloka practice.",
  "NSPhotoLibraryAddUsageDescription": "Save verse share-cards to your photo library.",
  "NSMicrophoneUsageDescription": "Used only for voice-reciting features (optional)."
}
```

### 1.3 Privacy manifest (required since May 2024)

- Create `ios/PrivacyInfo.xcprivacy` via Expo plugin or manually. It must declare every Required Reason API you call.
- At minimum for this app: `NSPrivacyAccessedAPICategoryUserDefaults` reason `CA92.1`, `NSPrivacyAccessedAPICategoryFileTimestamp` reason `C617.1`, `NSPrivacyAccessedAPICategoryDiskSpace` reason `E174.1`.
- `NSPrivacyTracking` = false. `NSPrivacyCollectedDataTypes` lists: email, Firebase user ID (linked to user, not for tracking), diagnostics.

### 1.4 Screenshots & metadata

- **iPhone 6.9″ (iPhone 16 Pro Max) — 1320×2868** — required, 3–10 images.
- **iPhone 6.5″** — required, 3–10 images.
- **iPad 13″** — required if you ticked `supportsTablet: true` (you have).
- App Preview video (optional but lifts conversion ~25%).
- Promotional text (170 char): "Begin your day with the eternal wisdom of the Bhagavad Gita. 700 verses, offline, ad-free."
- Description (4000 char): expanded pitch — see `MARKETING_LAUNCH_KIT.md` § Store listings.
- Keywords (100 char, comma-separated): `bhagavad gita, krishna, vedic, sanskrit, dharma, meditation, yoga, spiritual, scripture, hindu`.
- Support URL: `https://gita-rouge-tau.vercel.app/support`
- Marketing URL: `https://gita-rouge-tau.vercel.app/`
- Privacy policy URL: `https://gita-rouge-tau.vercel.app/privacy` ← must be live before submission.

### 1.5 Subscriptions

- In App Store Connect → Subscriptions, create:
  - Gita Pro — Yearly (`gita_pro_yearly_v1`, $35.99, 14-day free trial)
  - Gita Pro — Monthly (`gita_pro_monthly_v1`, $4.99)
  - Gita Pro — Lifetime (`gita_pro_lifetime_v1`, non-consumable).
- Map all three to RevenueCat offering **default** with entitlement **Gita Pro**.
- Add localized subscription name + description for each.
- Review the **Subscription Localization** fields — Apple rejects if trial wording is wrong.

### 1.6 App Review info

- Demo account: create `reviewer@alphawolf.dev` with a pre-granted Gita Pro entitlement (set via RevenueCat dashboard override).
- Review notes:
  > "The Dharma Blocker feature uses standard notifications + a deep link; there is no background app-blocking on iOS. On tap it routes the user back to today's sloka. The scripture text is under license per `src/data/SOURCE_AUDIT.md`."

### 1.7 `eas.json` — finalize the production submit

```jsonc
"submit": {
  "production": {
    "ios": {
      "ascAppId": "<fill after ASC record is created>",
      "appleTeamId": "<your team id>",
      "ascApiKeyPath": "./AuthKey.p8",
      "ascApiKeyIssuerId": "<your issuer id>",
      "ascApiKeyId": "<your key id>"
    }
  }
}
```

- Store the `.p8` key outside the repo; reference it from CI or local only.

---

## 2 · Google Play Store

### 2.1 Play Console record

- Create app in Play Console.
- Package name: **com.alphawolf.gita** (must match `app.json`).
- Default language: en-US.
- Free app, in-app products.
- App category: Education.
- Declarations: Contains ads? **No**. Target audience: 13+ (Adults).

### 2.2 Data safety form (Play Console)

Required — auto-reject without it. Declare:

- **Personal info → Email**: collected, used for app functionality (auth), shared with no one, required.
- **Personal info → User IDs** (Firebase UID): collected, app functionality, not shared.
- **App activity → App interactions / In-app search history**: collected for analytics, not shared, optional.
- **App info and performance → Crash logs / Diagnostics**: collected via Crashlytics, optional.
- Data encryption in transit: **Yes**. At rest: **Yes** (Firebase).
- Users can request deletion: **Yes** (you need an account-delete flow — see § 3).

### 2.3 Permissions

- Android permissions in `AndroidManifest.xml` (generated via Expo):
  - `android.permission.INTERNET` — always.
  - `android.permission.POST_NOTIFICATIONS` — for daily reminders.
  - `android.permission.WRITE_EXTERNAL_STORAGE` / `READ_MEDIA_IMAGES` — share-card save.
  - The **dharma-blocker** module may request `**PACKAGE_USAGE_STATS`** and `**SYSTEM_ALERT_WINDOW**`. These require a "Permission declaration" form in Play Console justifying the use, plus screen recording showing the flow.

### 2.4 Assets

- High-res icon: 512×512 PNG (32-bit, no alpha).
- Feature graphic: 1024×500 PNG.
- Phone screenshots: min 3, max 8, 1080×1920 or 1080×2340.
- 7-inch tablet screenshots: optional.
- Short description (80 char): "Daily Bhagavad Gita — offline, ad-free, with Dharma-focus mode."
- Full description (4000 char): see `MARKETING_LAUNCH_KIT.md`.
- Promo video (optional, YouTube URL).

### 2.5 Subscriptions

- In Play Console → Monetization → Subscriptions, create the matching three products with the same identifiers you used on Apple for parity.
- Each subscription must have a base plan + offer (for the free trial).

### 2.6 Content rating

- Complete IARC questionnaire. Answers: no violence, no profanity, no sexual content. Result: **PEGI 3 / ESRB Everyone**.

---

## 3 · Account deletion + GDPR

Required by both stores. Add before submission:

- `app/(tabs)/settings.tsx` → a "Delete my account" row.
- Flow: prompt → reauthenticate → call Firebase Cloud Function (or an `/api/account/delete` route) that:
  1. Revokes the user's Firebase ID tokens.
  2. Deletes their Firestore doc (`users/{uid}`).
  3. Deletes any stored file in Firebase Storage.
  4. Calls RevenueCat `subscribers/{uid} DELETE` to unlink their purchaser ID.
  5. Calls `admin.auth().deleteUser(uid)`.
- Add a web route `/delete-account` that non-logged-in users can read for the process.

---

## 4 · Vercel / web launch

- Domain: move from `gita-rouge-tau.vercel.app` to `gitapro.app` (or similar) before submission — the auto-generated URL looks unprofessional in store listings.
- Add `/privacy` and `/terms` as `app/privacy.tsx` / `app/terms.tsx` Expo Router screens, prerendered.
- Add `/support` as a simple contact form or mailto.
- Add Open Graph + Twitter meta tags in `app.json → expo.web`.
- Lighthouse: perf ≥ 85, SEO ≥ 90, a11y ≥ 90.
- Robots + sitemap generated.
- `/api/health` returns 200 from the deployed URL.
- Set Vercel project → Settings → Deployment Protection to "Production only".

---

## 5 · Pre-flight smoke test

Run on a real device the day of submission. This is your last checkpoint.

- Fresh install → Onboarding intro → step1–9 → paywall renders with real prices.
- Start trial → app lets you in → `/api/scholar` returns answers → streaks increment.
- Force close → reopen → still unlocked.
- Toggle Airplane mode → every screen shows a graceful loading + fallback, never a white screen.
- Kill RevenueCat key → paywall still renders fallback tiers + purchase fails with the friendly message (not the raw upstream string).
- Reset onboarding → cancel purchase → gets "Purchase cancelled" with no blocking modal.
- Restore → correctly routes to `(tabs)` if signed in, `/auth` if not.
- `adb logcat` / Xcode console shows structured JSON logs, no stack traces, no secrets.

---

## 6 · Launch-day ops

- RevenueCat dashboard open — watch trial start / paid rate for the first 48h.
- Vercel logs open — watch `/api/`* error rate. Anything above 1% investigate.
- Firebase Console → Authentication → watch for spikes indicating bots.
- Crashlytics — `com.alphawolf.gita` dashboard.
- Have a rollback plan: a previous EAS build tagged & ready to re-submit.

